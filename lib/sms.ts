// Provider-agnostic SMS. Configure MSG91 (popular in India) via env to go live;
// without it we return { sent: false } and the caller falls back to "test mode"
// (the OTP is surfaced to the requester so the flow is fully usable in dev).
//
// To enable real SMS, set:
//   SMS_PROVIDER=msg91
//   MSG91_AUTH_KEY=...           (your MSG91 auth key)
//   MSG91_SENDER_ID=HOUSEX       (6-char DLT-approved sender id)
//   MSG91_DLT_TEMPLATE_ID=...    (DLT template that contains ##OTP##)

export async function sendSms(phone: string, message: string): Promise<{ sent: boolean }> {
  const provider = (process.env.SMS_PROVIDER || "").toLowerCase();

  if (provider === "msg91" && process.env.MSG91_AUTH_KEY) {
    try {
      const to = phone.replace(/\D/g, "");
      const res = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: { "Content-Type": "application/json", authkey: process.env.MSG91_AUTH_KEY },
        body: JSON.stringify({
          template_id: process.env.MSG91_DLT_TEMPLATE_ID,
          sender: process.env.MSG91_SENDER_ID || "HOUSEX",
          short_url: "0",
          recipients: [{ mobiles: to.length === 10 ? `91${to}` : to, message }],
        }),
        signal: AbortSignal.timeout(8000),
      });
      return { sent: res.ok };
    } catch (err) {
      console.error("MSG91 send failed:", err);
      return { sent: false };
    }
  }

  // No provider configured — caller handles test mode.
  return { sent: false };
}
