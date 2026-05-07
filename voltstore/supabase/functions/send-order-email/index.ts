type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price?: number;
  line_total: number;
};

type EmailBody = {
  email: string;
  customerName: string;
  orderNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal?: number;
  deliveryFee?: number;
  total: number;
  items: OrderItem[];
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function formatLKR(amount: number) {
  return `LKR ${Number(amount).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

    const {
      email,
      customerName,
      orderNumber,
      paymentMethod,
      paymentStatus,
      subtotal,
      deliveryFee,
      total,
      items,
    } = (await req.json()) as EmailBody;

    if (!email || !customerName || !orderNumber || !items?.length) {
      throw new Error("Missing required email data");
    }

    const safeName = escapeHtml(customerName);
    const safeOrderNumber = escapeHtml(orderNumber);

    const itemRows = items
      .map((item) => {
        return `
          <tr>
            <td style="padding:12px;border-bottom:1px solid #eeeeee;">
              ${escapeHtml(item.product_name)}
            </td>
            <td style="padding:12px;border-bottom:1px solid #eeeeee;text-align:center;">
              ${item.quantity}
            </td>
            <td style="padding:12px;border-bottom:1px solid #eeeeee;text-align:right;">
              ${formatLKR(item.line_total)}
            </td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <div style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:680px;margin:0 auto;padding:30px 16px;">
          <div style="background:#0b0b0f;border-radius:18px 18px 0 0;padding:28px;">
            <h1 style="margin:0;color:#ff6a00;font-size:28px;">Tazz Electronics</h1>
            <p style="margin:8px 0 0;color:#d1d5db;">Electronics, accessories & repair services</p>
          </div>

          <div style="background:#ffffff;padding:30px;border-radius:0 0 18px 18px;">
            <h2 style="margin:0 0 12px;font-size:24px;color:#111827;">
              Order Placed Successfully
            </h2>

            <p style="font-size:15px;line-height:1.6;">
              Hi <b>${safeName}</b>,
            </p>

            <p style="font-size:15px;line-height:1.6;">
              Thank you for shopping with <b>Tazz Electronics</b>. Your order has been received successfully.
            </p>

            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:18px;margin:24px 0;">
              <p style="margin:6px 0;"><b>Order Number:</b> ${safeOrderNumber}</p>
              <p style="margin:6px 0;"><b>Payment Method:</b> ${escapeHtml(paymentMethod)}</p>
              <p style="margin:6px 0;"><b>Payment Status:</b> ${escapeHtml(paymentStatus)}</p>
              <p style="margin:6px 0;"><b>Total Amount:</b> ${formatLKR(total)}</p>
            </div>

            <h3 style="margin:24px 0 12px;">Order Summary</h3>

            <table style="width:100%;border-collapse:collapse;border:1px solid #eeeeee;">
              <thead>
                <tr style="background:#111827;color:#ffffff;">
                  <th style="padding:12px;text-align:left;">Product</th>
                  <th style="padding:12px;text-align:center;">Qty</th>
                  <th style="padding:12px;text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <div style="margin-top:22px;border-top:1px solid #eeeeee;padding-top:16px;">
              ${
                subtotal !== undefined
                  ? `<p style="margin:6px 0;text-align:right;">Subtotal: <b>${formatLKR(subtotal)}</b></p>`
                  : ""
              }
              ${
                deliveryFee !== undefined
                  ? `<p style="margin:6px 0;text-align:right;">Delivery Fee: <b>${formatLKR(deliveryFee)}</b></p>`
                  : ""
              }
              <p style="margin:10px 0;text-align:right;font-size:18px;">
                Grand Total: <b style="color:#ff6a00;">${formatLKR(total)}</b>
              </p>
            </div>

            <p style="font-size:15px;line-height:1.6;margin-top:24px;">
              We will contact you soon with delivery updates.
            </p>

            <p style="font-size:15px;line-height:1.6;">
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
        from: "Tazz Electronics <orders@tazzelectronics.me>",
        to: [email],
        subject: `Order Placed Successfully - ${safeOrderNumber}`,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email sending failed",
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
        message: "Order email sent successfully",
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
