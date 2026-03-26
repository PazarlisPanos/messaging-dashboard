import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllClients } from '@/lib/clients'
import { query } from '@/lib/db'
import AdminPanel from '@/components/admin/AdminPanel'

export const revalidate = 0

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'super_admin') redirect('/dashboard')

  const [clients, users] = await Promise.all([
    getAllClients(),
    query(`SELECT id, username, role, client_slug, active, last_login FROM dashboard_users ORDER BY created_at ASC`).catch(() => []),
  ])

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Admin Panel</h2>
        <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Manage clients and users</p>
      </div>
      <AdminPanel initialClients={clients} initialUsers={users as any[]} />
    </div>
  )
}
