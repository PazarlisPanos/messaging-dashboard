#!/usr/bin/env node
// User management — Messaging Dashboard (multi-tenant)
//
// Usage:
//   node scripts/manage-users.mjs add <username> <password> <role> [client-slug]
//   node scripts/manage-users.mjs list
//   node scripts/manage-users.mjs list-clients
//   node scripts/manage-users.mjs add-client <slug> <name> <db-url> [wa-webhook] [vb-webhook]
//   node scripts/manage-users.mjs deactivate <username>
//   node scripts/manage-users.mjs activate <username>
//   node scripts/manage-users.mjs reset-password <username> <new-password>
//   node scripts/manage-users.mjs delete <username>
//
// Roles: super_admin (no client-slug needed) | operator (must provide client-slug)
//
// Examples:
//   node scripts/manage-users.mjs add-client acme "Acme Corp" "postgresql://..." /webhook/acme-wa
//   node scripts/manage-users.mjs add nikos secret123 super_admin
//   node scripts/manage-users.mjs add maria pass456 operator acme

import { randomBytes, scrypt } from 'crypto'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const env = readFileSync(join(__dirname, '../.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const [k, ...v] = t.split('=')
    if (k && !process.env[k]) process.env[k] = v.join('=').replace(/^["']|["']$/g, '')
  }
} catch {}

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL not set')
  process.exit(1)
}

const { default: pg } = await import('pg')
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 })

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = await new Promise((res, rej) => {
    scrypt(password, salt, 64, (err, key) => err ? rej(err) : res(key.toString('hex')))
  })
  return `${salt}:${hash}`
}

const [,, command, ...args] = process.argv

async function run() {
  try {
    switch (command) {

      case 'add': {
        const [username, password, role = 'operator', clientSlug = null] = args
        if (!username || !password) {
          console.error('Usage: add <username> <password> <role> [client-slug]')
          process.exit(1)
        }
        if (!['super_admin', 'operator'].includes(role)) {
          console.error('Role must be: super_admin or operator')
          process.exit(1)
        }
        if (role === 'operator' && !clientSlug) {
          console.error('Operators must have a client-slug. Example: add maria pass operator acme')
          process.exit(1)
        }
        if (role === 'super_admin' && clientSlug) {
          console.warn('⚠️  super_admin does not need a client-slug — ignoring it')
        }
        const hashed = await hashPassword(password)
        await pool.query(
          `INSERT INTO dashboard_users (username, password, role, client_slug)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (username) DO NOTHING`,
          [username, hashed, role, role === 'super_admin' ? null : clientSlug]
        )
        console.log(`✅  User "${username}" created (${role}${clientSlug && role !== 'super_admin' ? ` → ${clientSlug}` : ''})`)
        break
      }

      case 'list': {
        const { rows } = await pool.query(
          `SELECT u.id, u.username, u.role, u.client_slug, u.active, u.last_login
           FROM dashboard_users u ORDER BY u.created_at ASC`
        )
        if (!rows.length) { console.log('No users found.'); break }
        console.log('\n ID  Username            Role          Client       Active  Last login')
        console.log('─'.repeat(72))
        for (const u of rows) {
          const ll = u.last_login ? new Date(u.last_login).toLocaleString('el-GR') : 'never'
          console.log(
            ` ${String(u.id).padEnd(3)} ${u.username.padEnd(20)} ${u.role.padEnd(13)} ${(u.client_slug ?? '—').padEnd(12)} ${String(u.active).padEnd(7)} ${ll}`
          )
        }
        console.log()
        break
      }

      case 'add-client': {
        const [slug, name, dbUrl, waWebhook = null, vbWebhook = null] = args
        if (!slug || !name || !dbUrl) {
          console.error('Usage: add-client <slug> <name> <db-url> [wa-webhook] [vb-webhook]')
          process.exit(1)
        }
        await pool.query(
          `INSERT INTO clients (slug, name, database_url, wa_webhook, vb_webhook)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (slug) DO NOTHING`,
          [slug, name, dbUrl, waWebhook, vbWebhook]
        )
        console.log(`✅  Client "${name}" (/${slug}) created`)
        break
      }

      case 'list-clients': {
        const { rows } = await pool.query(`SELECT slug, name, wa_webhook, vb_webhook, active FROM clients ORDER BY name`)
        if (!rows.length) { console.log('No clients found.'); break }
        console.log('\n Slug                 Name                 WA webhook              VB webhook')
        console.log('─'.repeat(80))
        for (const c of rows) {
          console.log(
            ` ${c.slug.padEnd(22)} ${c.name.padEnd(22)} ${(c.wa_webhook ?? '—').padEnd(24)} ${c.vb_webhook ?? '—'}`
          )
        }
        console.log()
        break
      }

      case 'reset-password': {
        const [username, newPassword] = args
        if (!username || !newPassword) { console.error('Usage: reset-password <username> <new-password>'); process.exit(1) }
        const hashed = await hashPassword(newPassword)
        const { rowCount } = await pool.query(`UPDATE dashboard_users SET password=$1 WHERE username=$2`, [hashed, username])
        if (!rowCount) console.error(`❌  User "${username}" not found`)
        else console.log(`✅  Password reset for "${username}"`)
        break
      }

      case 'deactivate': {
        const { rowCount } = await pool.query(`UPDATE dashboard_users SET active=FALSE WHERE username=$1`, [args[0]])
        if (!rowCount) console.error(`❌  User "${args[0]}" not found`)
        else console.log(`✅  "${args[0]}" deactivated`)
        break
      }

      case 'activate': {
        const { rowCount } = await pool.query(`UPDATE dashboard_users SET active=TRUE WHERE username=$1`, [args[0]])
        if (!rowCount) console.error(`❌  User "${args[0]}" not found`)
        else console.log(`✅  "${args[0]}" activated`)
        break
      }

      case 'delete': {
        const { rowCount } = await pool.query(`DELETE FROM dashboard_users WHERE username=$1`, [args[0]])
        if (!rowCount) console.error(`❌  User "${args[0]}" not found`)
        else console.log(`✅  "${args[0]}" deleted`)
        break
      }

      default:
        console.log(`
Messaging Dashboard — User & Client Management
═══════════════════════════════════════════════
Users:
  add <user> <pass> <role> [slug]   Create user (role: super_admin | operator)
  list                              List all users
  reset-password <user> <pass>      Change password
  deactivate <user>                 Block login
  activate <user>                   Re-enable login
  delete <user>                     Remove permanently

Clients:
  add-client <slug> <name> <db-url> [wa-hook] [vb-hook]   Add a client
  list-clients                                              List all clients

Examples:
  node scripts/manage-users.mjs add-client acme "Acme Corp" "postgresql://u:p@h:5432/acme_db" /webhook/acme-wa
  node scripts/manage-users.mjs add nikos secret123 super_admin
  node scripts/manage-users.mjs add maria pass456 operator acme
  node scripts/manage-users.mjs list
        `)
    }
  } finally {
    await pool.end()
  }
}

run().catch(err => { console.error('Error:', err.message); process.exit(1) })
