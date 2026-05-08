type RepairEmailType = "received" | "assigned" | "completed";

type EmailBody = {
  email: string;
  customerName: string;
  type: RepairEmailType;
  deviceType: string;
  brand?: string;
  model?: string;
  issueDescription?: string;
  preferredDate?: string;
  status?: string;
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function escapeHtml(value: string) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getEmailContent(data: EmailBody) {
  const safeName = escapeHtml(data.customerName);
  const safeDevice = escapeHtml(data.deviceType);
  const safeBrand = escapeHtml(data.brand || "N/A");
  const safeModel = escapeHtml(data.model || "N/A");
  const safeIssue = escapeHtml(data.issueDescription || "N/A");
  const safeDate = escapeHtml(data.preferredDate || "Not selected");

  if (data.type === "assigned") {
    return {
      title: "Technician Assigned",
      subject: "Technician Assigned - Tazz Electronics",
      message: `
        <p style="font-size:15px;line-height:1.6;">
          Hi <b>${safeName}</b>,
        </p>
        <p style="font-size:15px;line-height:1.6;">
          A technician has been assigned to your repair request. We will contact you soon with more details.
        </p>
      `,
    };
  }

  if (data.type === "completed") {
    return {
      title: "Repair Completed",
      subject: "Repair Completed - Tazz Electronics",
      message: `
        <p style="font-size:15px;line-height:1.6;">
          Hi <b>${safeName}</b>,
        </p>
        <p style="font-size:15px;line-height:1.6;">
          Your repair has been completed successfully. Thank you for choosing <b>Tazz Electronics</b>.
        </p>
      `,
    };
  }

  return {
    title: "Repair Request Received",
    subject: "Repair Request Received - Tazz Electronics",
    message: `
      <p style="font-size:15px;line-height:1.6;">
        Hi <b>${safeName}</b>,
      </p>
      <p style="font-size:15px;line-height:1.6;">
        Your repair request has been received successfully. Our team will contact you shortly.
      </p>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:18px;margin:24px 0;">
        <p style="margin:6px 0;"><b>Device:</b> ${safeDevice}</p>
        <p style="margin:6px 0;"><b>Brand:</b> ${safeBrand}</p>
        <p style="margin:6px 0;"><b>Model:</b> ${safeModel}</p>
        <p style="margin:6px 0;"><b>Preferred Date:</b> ${safeDate}</p>
        <p style="margin:6px 0;"><b>Issue:</b> ${safeIssue}</p>
      </div>
    `,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY secret");
    }

    const body = (await req.json()) as EmailBody;

    if (!body.email || !body.customerName || !body.type || !body.deviceType) {
      throw new Error("Missing required repair email data");
    }

    const content = getEmailContent(body);

    const html = `
      <div style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:680px;margin:0 auto;padding:30px 16px;">
          <div style="background:#0b0b0f;border-radius:18px 18px 0 0;padding:28px;">
            <h1 style="margin:0;color:#ff6a00;font-size:28px;">Tazz Electronics</h1>
            <p style="margin:8px 0 0;color:#d1d5db;">Electronics, accessories & repair services</p>
          </div>

          <div style="background:#ffffff;padding:30px;border-radius:0 0 18px 18px;">
            <h2 style="margin:0 0 12px;font-size:24px;color:#111827;">
              ${content.title}
            </h2>

            ${content.message}

            <p style="font-size:15px;line-height:1.6;margin-top:24px;">
              Regards,<br />
              <b>Tazz Electronics Team</b>
            </p>
          </div>
        </div>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tazz Electronics <repairs@tazzelectronics.me>",
        to: [body.email],
        subject: content.subject,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Repair email sending failed",
          error: resendData,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Repair email sent successfully",
        data: resendData,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});