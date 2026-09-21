// Receives a Supabase Database Webhook after an INSERT into public.orders.
// Deploy with JWT verification disabled; the webhook secret below authenticates the request.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-noora-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const expected = Deno.env.get("ORDER_WEBHOOK_SECRET");
  const received = req.headers.get("x-noora-webhook-secret");
  if (!expected || !received || received !== expected) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const ownerEmail = Deno.env.get("OWNER_EMAIL");
  if (!resendKey || !ownerEmail) {
    return new Response("Email secrets are not configured", { status: 500, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const order = payload?.record;
    if (payload?.type !== "INSERT" || payload?.table !== "orders" || !order || !order.customer_name || !order.customer_phone || !order.product_name) {
      return new Response("Invalid webhook payload", { status: 400, headers: corsHeaders });
    }

    const safe = (v: unknown) => String(v ?? "Not provided").slice(0, 1000);
    const text = [
      "A new NOORA STUDIO pre-launch interest request was submitted.",
      `Request ID: ${safe(order.id)}`,
      `Name: ${safe(order.customer_name)}`,
      `Phone: ${safe(order.customer_phone)}`,
      `Email: ${safe(order.customer_email)}`,
      `City: ${safe(order.city)}`,
      `Delivery address: ${safe(order.delivery_address)}`,
      `Interested item: ${safe(order.product_name)}`,
      `Preferred size: ${safe(order.product_size)}`,
      `Quantity: ${safe(order.quantity)}`,
      `Payment preference: ${safe(order.payment_method)}`,
      `Status: ${safe(order.order_status)}`,
      "\nThis is an interest request, not a confirmed purchase.",
    ].join("\n");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "NOORA STUDIO Orders <onboarding@resend.dev>",
        to: [ownerEmail],
        subject: `New NOORA STUDIO request #${safe(order.id)}`,
        text,
      }),
    });
    if (!emailResponse.ok) {
      console.error("Resend error", await emailResponse.text());
      return new Response("Email provider rejected the message", { status: 502, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response("Invalid request", { status: 400, headers: corsHeaders });
  }
});
