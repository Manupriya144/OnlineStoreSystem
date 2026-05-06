import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function getRole(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.log("Role error:", error.message);
      setRole("customer");
      return "customer";
    }

    const finalRole = data?.role?.trim().toLowerCase() || "customer";
    setRole(finalRole);
    return finalRole;
  }

  async function ensureProfile(currentUser, fullName = "") {
    if (!currentUser) return;

    const { data: existing, error: selectError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (selectError) {
      console.log("Profile select error:", selectError.message);
      return;
    }

    if (existing) return;

    const { error } = await supabase.from("profiles").insert({
      id: currentUser.id,
      full_name:
        fullName || currentUser.user_metadata?.full_name || currentUser.email,
      role: "customer",
    });

    if (error) {
      console.log("Profile insert error:", error.message);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setAuthLoading(true);

      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.log("Session error:", error.message);
        setUser(null);
        setRole(null);
        setAuthLoading(false);
        return;
      }

      const currentUser = data.session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        await getRole(currentUser.id);
      } else {
        setRole(null);
      }

      if (mounted) setAuthLoading(false);
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        getRole(currentUser.id).finally(() => {
          setAuthLoading(false);
        });
      } else {
        setRole(null);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function register(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      await ensureProfile(data.user, fullName);
    }

    return data;
  }

  async function login(email, password) {
    setAuthLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthLoading(false);
      throw error;
    }

    if (data.user) {
      await ensureProfile(data.user);
      setUser(data.user);
      await getRole(data.user.id);
    }

    setAuthLoading(false);
    return data;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("Logout error:", error.message);
    }

    setUser(null);
    setRole(null);
    setAuthLoading(false);

    window.location.replace("/");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        authLoading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}