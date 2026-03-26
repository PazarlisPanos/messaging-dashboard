import { query } from './db'
import type { Client } from '@/types'

export async function getClient(slug: string): Promise<Client | null> {
  const rows = await query<Client>(
    `SELECT * FROM clients WHERE slug = $1 AND active = TRUE LIMIT 1`,
    [slug]
  )
  return rows[0] ?? null
}

export async function getAllClients(): Promise<Client[]> {
  return query<Client>(`SELECT * FROM clients WHERE active = TRUE ORDER BY name ASC`)
}

export async function createClient(data: {
  slug: string
  name: string
  database_url: string
  wa_webhook?: string
  vb_webhook?: string
  bot_toggle_webhook?: string
}): Promise<Client> {
  const rows = await query<Client>(
    `INSERT INTO clients (slug, name, database_url, wa_webhook, vb_webhook, bot_toggle_webhook)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.slug, data.name, data.database_url,
     data.wa_webhook ?? null, data.vb_webhook ?? null, data.bot_toggle_webhook ?? null]
  )
  return rows[0]
}

export async function updateClient(
  slug: string,
  data: Partial<Pick<Client, 'name' | 'database_url' | 'wa_webhook' | 'vb_webhook' | 'bot_toggle_webhook' | 'active'>>
): Promise<Client | null> {
  const fields = Object.keys(data)
  if (!fields.length) return null
  const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')
  const rows = await query<Client>(
    `UPDATE clients SET ${sets} WHERE slug = $1 RETURNING *`,
    [slug, ...Object.values(data)]
  )
  return rows[0] ?? null
}
