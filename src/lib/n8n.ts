export interface ReplyPayload {
  platform: 'whatsapp' | 'viber'
  contact_id: string
  message: string
  session_id?: string
}

export async function triggerN8nReply(
  payload: ReplyPayload,
  webhookPath: string   // comes from clients table, per-client
): Promise<void> {
  const base = process.env.N8N_BASE_URL
  if (!base || !webhookPath) {
    throw new Error(`n8n webhook not configured for this client`)
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (process.env.N8N_WEBHOOK_SECRET) {
    headers['x-webhook-secret'] = process.env.N8N_WEBHOOK_SECRET
  }

  const res = await fetch(`${base}${webhookPath}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`n8n webhook failed: ${res.status} ${text}`)
  }
}
