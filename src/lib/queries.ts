import { clientQuery } from './db'
import type {
  DashboardStats, DailyMessageCount, PeakHour,
  Conversation, WaMessage, LanguageStat, IntentStat, DailyAiCost, AiCostByPlatform,
} from '@/types'

const CONTACT_ID = `CASE WHEN direction = 'in' THEN sender ELSE recipient END`

function toDateStr(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'string') return val.substring(0, 10)
  if (val instanceof Date) return val.toISOString().substring(0, 10)
  return String(val).substring(0, 10)
}

export async function getDashboardStats(dbUrl: string): Promise<DashboardStats> {
  try {
    const [wa] = await clientQuery<{
      total: string; incoming: string; outgoing: string
      unique_contacts: string; ai_out: string; manual_out: string
      needs_human: string; avg_confidence: string; conversations_answered: string
    }>(dbUrl, `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE direction = 'in') AS incoming,
        COUNT(*) FILTER (WHERE direction = 'out') AS outgoing,
        COUNT(DISTINCT (${CONTACT_ID})) AS unique_contacts,
        -- AI: outgoing messages where ai_used = true
        COUNT(*) FILTER (WHERE direction = 'out' AND ai_used = TRUE) AS ai_out,
        -- Manual: outgoing messages where ai_used is false or null
        COUNT(*) FILTER (WHERE direction = 'out' AND (ai_used = FALSE OR ai_used IS NULL)) AS manual_out,
        (SELECT COUNT(*) FROM wa_sessions WHERE needs_human = TRUE) +
        (SELECT COUNT(*) FROM vb_sessions WHERE needs_human = TRUE) AS needs_human,
        -- Confidence is 0-1 scale
        ROUND(AVG(confidence) FILTER (WHERE confidence IS NOT NULL AND confidence <= 1)::numeric, 4) AS avg_confidence,
        -- Contacts that have at least one outgoing reply
        COUNT(DISTINCT CASE WHEN direction = 'out' THEN recipient END) AS conversations_answered
      FROM wa_messages
    `)
    const [today] = await clientQuery<{ count: string }>(dbUrl,
      `SELECT COUNT(*) AS count FROM wa_messages WHERE created_at::date = CURRENT_DATE`)

    let vbTotal = 0
    let vbUniqueContacts = 0
    try {
      const [vb] = await clientQuery<{ total: string; unique_contacts: string }>(dbUrl, `
        SELECT COUNT(*) AS total,
               COUNT(DISTINCT CASE WHEN direction='in' THEN sender ELSE recipient END) AS unique_contacts
        FROM vb_messages
      `)
      vbTotal = parseInt(vb?.total ?? '0')
      vbUniqueContacts = parseInt(vb?.unique_contacts ?? '0')
    } catch { }

    const total = parseInt(wa.total)
    const aiOut = parseInt(wa.ai_out)
    const manualOut = parseInt(wa.manual_out)
    const waUniqueContacts = parseInt(wa.unique_contacts)
    return {
      total_messages: total + vbTotal,
      incoming_messages: parseInt(wa.incoming),
      outgoing_messages: parseInt(wa.outgoing),
      unique_contacts: waUniqueContacts + vbUniqueContacts,
      total_conversations: waUniqueContacts + vbUniqueContacts,
      wa_messages: total,
      vb_messages: vbTotal,
      messages_today: parseInt(today.count),
      needs_human_count: parseInt(wa.needs_human),
      ai_used_count: aiOut,
      manual_count: manualOut,
      avg_confidence: wa.avg_confidence ? parseFloat(wa.avg_confidence) : null,
      conversations_answered: parseInt(wa.conversations_answered) || 0,
    }
  } catch {
    return {
      total_messages: 0, incoming_messages: 0, outgoing_messages: 0,
      unique_contacts: 0, total_conversations: 0, wa_messages: 0,
      vb_messages: 0, messages_today: 0, needs_human_count: 0,
      ai_used_count: 0, manual_count: 0, avg_confidence: null,
      conversations_answered: 0,
    }
  }
}

export async function getBotPausedCount(dbUrl: string): Promise<number> {
  try {
    const [wa] = await clientQuery<{ count: string }>(dbUrl,
      `SELECT COUNT(*) AS count FROM wa_sessions WHERE bot_paused = TRUE`)
    let vbCount = 0
    try {
      const [vb] = await clientQuery<{ count: string }>(dbUrl,
        `SELECT COUNT(*) AS count FROM vb_sessions WHERE bot_paused = TRUE`)
      vbCount = parseInt(vb?.count ?? '0')
    } catch { }
    return parseInt(wa?.count ?? '0') + vbCount
  } catch { return 0 }
}

export async function getDailyMessages(dbUrl: string): Promise<DailyMessageCount[]> {
  try {
    const rows = await clientQuery<{ date: unknown; incoming: string; outgoing: string }>(dbUrl, `
      SELECT
        to_char(created_at::date, 'YYYY-MM-DD') AS date,
        COUNT(*) FILTER (WHERE direction = 'in') AS incoming,
        COUNT(*) FILTER (WHERE direction = 'out') AS outgoing
      FROM wa_messages
      WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY created_at::date ORDER BY created_at::date ASC
    `)
    return rows.map(r => ({
      date: toDateStr(r.date),
      incoming: parseInt(r.incoming),
      outgoing: parseInt(r.outgoing),
    }))
  } catch { return [] }
}

export async function getPeakHours(dbUrl: string): Promise<PeakHour[]> {
  try {
    const rows = await clientQuery<{ hour: string; count: string }>(dbUrl, `
      SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*) AS count
      FROM wa_messages
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND direction = 'in'
      GROUP BY hour ORDER BY hour ASC
    `)
    return rows.map(r => ({ hour: parseInt(r.hour), count: parseInt(r.count) }))
  } catch { return [] }
}

export async function getLanguageStats(dbUrl: string): Promise<LanguageStat[]> {
  try {
    const rows = await clientQuery<{ lang: string; count: string }>(dbUrl, `
      SELECT COALESCE(lang, 'unknown') AS lang, COUNT(*) AS count
      FROM wa_messages
      WHERE direction = 'in' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY lang ORDER BY count DESC LIMIT 8
    `)
    return rows.map(r => ({ lang: String(r.lang), count: parseInt(String(r.count)) }))
  } catch { return [] }
}

export async function getTopIntents(dbUrl: string): Promise<IntentStat[]> {
  try {
    return clientQuery<IntentStat>(dbUrl, `
      SELECT intent, COUNT(*) AS count
      FROM wa_messages
      WHERE intent IS NOT NULL AND intent != ''
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY intent ORDER BY count DESC LIMIT 8
    `)
  } catch { return [] }
}

export async function getDailyAiCost(dbUrl: string): Promise<DailyAiCost[]> {
  try {
    const rows = await clientQuery<{ date: unknown; total_tokens: string; cost_usd: string }>(dbUrl, `
      SELECT
        to_char(created_at::date, 'YYYY-MM-DD') AS date,
        SUM(total_tokens)::int AS total_tokens,
        ROUND(SUM(cost_usd)::numeric, 4) AS cost_usd
      FROM ai_usage
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY created_at::date ORDER BY created_at::date ASC
    `)
    return rows.map(r => ({
      date: toDateStr(r.date),
      total_tokens: parseInt(r.total_tokens),
      cost_usd: parseFloat(r.cost_usd),
    }))
  } catch { return [] }
}

export async function getWaConversations(dbUrl: string): Promise<Conversation[]> {
  try {
    const rows = await clientQuery<{
      contact_id: string
      display_name: string | null
      last_message: string | null
      last_message_at: unknown
      unread_count: string
      needs_human: boolean | null
      last_intent: string | null
      lang: string | null
    }>(dbUrl, `
      SELECT
        conv.contact_id,
        s.display_name,
        last_msg.last_message,
        conv.last_message_at,
        conv.unread_count,
        s.needs_human,
        s.bot_paused,
        s.last_intent,
        s.lang
      FROM (
        SELECT
          CASE WHEN direction='in' THEN sender ELSE recipient END AS contact_id,
          MAX(created_at) AS last_message_at,
          -- unread = incoming messages since last outgoing reply
          COUNT(*) FILTER (WHERE direction = 'in'
            AND created_at > COALESCE(
              (SELECT MAX(m2.created_at) FROM wa_messages m2
               WHERE m2.direction = 'out'
               AND (CASE WHEN direction='in' THEN sender ELSE recipient END) =
                   (CASE WHEN m2.direction='in' THEN m2.sender ELSE m2.recipient END)),
              '1970-01-01'
            )
          ) AS unread_count
        FROM wa_messages
        GROUP BY CASE WHEN direction='in' THEN sender ELSE recipient END
      ) conv
      LEFT JOIN LATERAL (
        SELECT text AS last_message
        FROM wa_messages m2
        WHERE CASE WHEN m2.direction='in' THEN m2.sender ELSE m2.recipient END = conv.contact_id
        ORDER BY m2.created_at DESC LIMIT 1
      ) last_msg ON true
      LEFT JOIN wa_sessions s ON s.sender = conv.contact_id
      ORDER BY s.needs_human DESC NULLS LAST, conv.last_message_at DESC
      LIMIT 100
    `)

    return rows.map(r => ({
      contact_id: String(r.contact_id),
      display_name: r.display_name ?? null,
      last_message: r.last_message ? String(r.last_message) : null,
      last_message_at: r.last_message_at instanceof Date
        ? r.last_message_at : new Date(String(r.last_message_at)),
      unread_count: parseInt(String(r.unread_count)) || 0,
      platform: 'whatsapp',
      status: 'open',
      needs_human: r.needs_human ?? false,
      bot_paused: (r as any).bot_paused ?? false,
      last_intent: r.last_intent ?? null,
      lang: r.lang ?? null,
      conversation_key: null,
    }))
  } catch (e) {
    console.error('[getWaConversations]', e)
    return []
  }
}

export async function getWaMessages(dbUrl: string, contactId: string): Promise<WaMessage[]> {
  try {
    return clientQuery<WaMessage>(dbUrl, `
      SELECT
        m.id, m.created_at, m.sender, m.recipient, m.direction,
        m.message_id, m.text, m.message_type, m.intent, m.lang,
        m.location_name, m.meta_json, m.resolved_by, m.confidence,
        m.reply_to_message_id, m.conversation_key, m.ai_used,
        m.media_url, m.media_drive_id,
        (${CONTACT_ID}) AS contact_id,
        (SELECT ws.status FROM wa_statuses ws
         WHERE ws.message_id = m.message_id
         ORDER BY ws.status_timestamp DESC LIMIT 1) AS status
      FROM wa_messages m
      WHERE (${CONTACT_ID}) = $1
      ORDER BY m.created_at ASC LIMIT 200
    `, [contactId])
  } catch { return [] }
}

export async function getVbConversations(dbUrl: string): Promise<Conversation[]> {
  try {
    const rows = await clientQuery<{
      contact_id: string; last_message: string | null
      last_message_at: unknown; unread_count: string
      needs_human: boolean | null; bot_paused: boolean | null
      display_name: string | null
    }>(dbUrl, `
      SELECT
        conv.contact_id,
        s.display_name,
        last_msg.last_message,
        conv.last_message_at,
        conv.unread_count,
        COALESCE(s.bot_paused, FALSE) AS bot_paused,
        COALESCE(s.needs_human, FALSE) AS needs_human
      FROM (
        SELECT
          CASE WHEN direction='in' THEN sender ELSE recipient END AS contact_id,
          MAX(created_at) AS last_message_at,
          -- unread = incoming messages since last outgoing reply
          COUNT(*) FILTER (WHERE direction = 'in'
            AND created_at > COALESCE(
              (SELECT MAX(m2.created_at) FROM vb_messages m2
               WHERE m2.direction = 'out'
               AND (CASE WHEN direction='in' THEN sender ELSE recipient END) =
                   (CASE WHEN m2.direction='in' THEN m2.sender ELSE m2.recipient END)),
              '1970-01-01'
            )
          ) AS unread_count
        FROM vb_messages
        GROUP BY CASE WHEN direction='in' THEN sender ELSE recipient END
      ) conv
      LEFT JOIN LATERAL (
        SELECT text AS last_message FROM vb_messages m2
        WHERE CASE WHEN m2.direction='in' THEN m2.sender ELSE m2.recipient END = conv.contact_id
        ORDER BY m2.created_at DESC LIMIT 1
      ) last_msg ON true
      LEFT JOIN vb_sessions s ON s.sender = 'viber_dm:' || conv.contact_id
      ORDER BY s.needs_human DESC NULLS LAST, conv.last_message_at DESC
      LIMIT 100
    `)
    return rows.map(r => ({
      contact_id: String(r.contact_id),
      display_name: r.display_name ?? null,
      last_message: r.last_message ? String(r.last_message) : null,
      last_message_at: r.last_message_at instanceof Date
        ? r.last_message_at : new Date(String(r.last_message_at)),
      unread_count: parseInt(String(r.unread_count)) || 0,
      platform: 'viber',
      status: 'open',
      needs_human: r.needs_human ?? false,
      bot_paused: r.bot_paused ?? false,
      conversation_key: null,
    }))
  } catch (e) {
    console.error('[getVbConversations]', e)
    return []
  }
}

export async function getVbMessages(dbUrl: string, contactId: string): Promise<WaMessage[]> {
  try {
    return clientQuery<WaMessage>(dbUrl, `
      SELECT
        m.id, m.created_at, m.sender, m.recipient, m.direction,
        m.message_id, m.text, m.message_type, m.intent, m.lang,
        NULL AS location_name, m.meta_json,
        NULL AS resolved_by, NULL AS confidence,
        NULL AS reply_to_message_id, m.conversation_key, m.ai_used,
        CASE WHEN m.direction='in' THEN m.sender ELSE m.recipient END AS contact_id,
        NULL AS status
      FROM vb_messages m
      WHERE CASE WHEN m.direction='in' THEN m.sender ELSE m.recipient END = $1
      ORDER BY m.created_at ASC LIMIT 200
    `, [contactId])
  } catch { return [] }
}

export async function getTopIntent(dbUrl: string): Promise<{ intent: string; count: number } | null> {
  try {
    const rows = await clientQuery<{ intent: string; count: string }>(dbUrl, `
      SELECT last_intent AS intent, COUNT(*) AS count
      FROM wa_sessions
      WHERE last_intent IS NOT NULL AND last_intent != ''
      GROUP BY last_intent ORDER BY count DESC LIMIT 1
    `)
    if (!rows[0]) return null
    return { intent: rows[0].intent, count: parseInt(rows[0].count) }
  } catch { return null }
}

export async function getFallbackRate(dbUrl: string): Promise<{ with_fallback: number; total: number }> {
  try {
    const [r] = await clientQuery<{ with_fallback: string; total: string }>(dbUrl, `
      SELECT
        COUNT(*) FILTER (WHERE fallback_count > 0) AS with_fallback,
        COUNT(*) AS total
      FROM wa_sessions
    `)
    return { with_fallback: parseInt(r.with_fallback) || 0, total: parseInt(r.total) || 0 }
  } catch { return { with_fallback: 0, total: 0 } }
}

export async function getResolvedToday(dbUrl: string): Promise<number> {
  try {
    const [r] = await clientQuery<{ count: string }>(dbUrl, `
      SELECT COUNT(*) AS count FROM wa_sessions
      WHERE resolved_by IS NOT NULL AND last_message_at::date = CURRENT_DATE
    `)
    return parseInt(r.count) || 0
  } catch { return 0 }
}

export async function getAvgResponseTime(dbUrl: string): Promise<number | null> {
  try {
    const [r] = await clientQuery<{ avg_seconds: string | null }>(dbUrl, `
      SELECT ROUND(AVG(diff_seconds)::numeric, 0) AS avg_seconds
      FROM (
        SELECT
          EXTRACT(EPOCH FROM (
            MIN(out_msg.created_at) - in_msg.created_at
          )) AS diff_seconds
        FROM wa_messages in_msg
        JOIN wa_messages out_msg
          ON out_msg.conversation_key = in_msg.conversation_key
          AND out_msg.direction = 'out'
          AND out_msg.created_at > in_msg.created_at
        WHERE in_msg.direction = 'in'
        GROUP BY in_msg.id
      ) t
      WHERE diff_seconds > 0 AND diff_seconds < 3600
    `)
    return r.avg_seconds ? parseInt(r.avg_seconds) : null
  } catch { return null }
}

export async function getAiCostByPlatform(dbUrl: string): Promise<AiCostByPlatform[]> {
  try {
    const rows = await clientQuery<{ platform: string; total_tokens: string; cost_usd: string; message_count: string }>(dbUrl, `
      SELECT
        COALESCE(platform, 'whatsapp') AS platform,
        SUM(total_tokens)::int AS total_tokens,
        ROUND(SUM(cost_usd)::numeric, 4) AS cost_usd,
        COUNT(*) AS message_count
      FROM ai_usage
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY platform
      ORDER BY cost_usd DESC
    `)
    return rows.map(r => ({
      platform: String(r.platform),
      total_tokens: parseInt(r.total_tokens) || 0,
      cost_usd: parseFloat(r.cost_usd) || 0,
      message_count: parseInt(r.message_count) || 0,
    }))
  } catch { return [] }
}
