export type Platform = 'whatsapp' | 'viber'
export type Direction = 'in' | 'out'
export type UserRole = 'super_admin' | 'operator'

export interface Client {
  id: number
  slug: string
  name: string
  database_url: string
  wa_webhook: string | null
  vb_webhook: string | null
  bot_toggle_webhook: string | null
  resolve_attention_webhook: string | null
  active: boolean
  created_at: Date
}

export interface WaMessage {
  id: number
  created_at: Date
  sender: string
  recipient: string
  direction: Direction
  message_id: string
  text: string | null
  message_type: string
  intent: string | null
  lang: string | null
  location_name: string | null
  meta_json: Record<string, unknown> | null
  resolved_by: string | null
  confidence: number | null
  reply_to_message_id: string | null
  conversation_key: string | null
  ai_used: boolean | null
  contact_id: string
  status?: string | null
  media_url?: string | null
  media_drive_id?: string | null
}

export interface Conversation {
  contact_id: string
  display_name: string | null
  last_message: string | null
  last_message_at: Date
  unread_count: number
  platform: Platform
  status: 'open' | 'resolved' | 'pending'
  needs_human?: boolean
  bot_paused?: boolean
  last_intent?: string | null
  lang?: string | null
  conversation_key?: string | null
}

export interface DashboardStats {
  total_messages: number
  incoming_messages: number
  outgoing_messages: number
  unique_contacts: number
  total_conversations: number
  wa_messages: number
  vb_messages: number
  messages_today: number
  needs_human_count: number
  ai_used_count: number
  manual_count: number
  avg_confidence: number | null
}

export interface DailyMessageCount {
  date: string
  incoming: number
  outgoing: number
}

export interface PeakHour {
  hour: number
  count: number
}

export interface LanguageStat {
  lang: string
  count: number
}

export interface IntentStat {
  intent: string
  count: number
}

export interface DailyAiCost {
  date: string
  total_tokens: number
  cost_usd: number
}
