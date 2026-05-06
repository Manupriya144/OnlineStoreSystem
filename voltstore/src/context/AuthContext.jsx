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
      .maybeSingle();

    if (error) {
      console.log("Role error:", error.message);
      setRole(null);
      return null;
    }

    const userRole = data?.role?.trim().toLowerCase() || "customer";

    console.log("ROLE DATA:", data);
    console.log("FINAL ROLE:", userRole);

    setRole(userRole);
    return userRole;
  }

  async function ensureProfile(currentUser, fullName = "") {
    if (!currentUser) return;

    const { data: existing, error: selectError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (selectError) {
      console.log("Profile select error:", selectError.message);
      return;
    }

    // ✅ If profile exists, do NOT update role
    if (existing) return;

    // ✅ Create only if missing
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
    async function initAuth() {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        await ensureProfile(currentUser);
        await getRole(currentUser.id);
      } else {
        setRole(null);
      }

      setAuthLoading(false);
    }

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;

        setUser(currentUser);

        if (currentUser) {
          await ensureProfile(currentUser);
          await getRole(currentUser.id);
        } else {
          setRole(null);
        }

        setAuthLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
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

    return data;
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await ensureProfile(data.user);
      await getRole(data.user.id);
    }

    return data;
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    window.location.href = "/login";
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