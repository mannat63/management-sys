export async function sendEventToN8N(payload) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("N8N_WEBHOOK_URL is not set. Event skipped:", payload.event_type);
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`n8n webhook failed for ${payload.event_type}: ${response.statusText}`);
      return false;
    }

    console.log("Event sent:", payload.event_type, payload.student?.name || "System");
    return true;
  } catch (error) {
    console.error(`n8n webhook error for ${payload.event_type}:`, error.message || error);
    return false;
  }
}
