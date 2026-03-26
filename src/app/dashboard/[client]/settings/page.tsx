import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/clients'
import { notFound } from 'next/navigation'
import ClientSettingsForm from '@/components/settings/ClientSettingsForm'
import ChangePasswordForm from '@/components/settings/ChangePasswordForm'

export default async function ClientSettingsPage({ params }: { params: { client: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const client = await getClient(params.client)
  if (!client) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Settings</h2>
        <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{client.name}</p>
      </div>
      <ClientSettingsForm client={client} isSuperAdmin={role === 'super_admin'} />
      <ChangePasswordForm />
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">About</h3>
        <div className="text-xs space-y-1" style={{ color: '#6b7280' }}>
          <p>Client slug: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)' }}>{client.slug}</span></p>
          <p>MsgHub · Messaging Dashboard · n8n automation</p>
        </div>
      </div>
    </div>
  )
}
