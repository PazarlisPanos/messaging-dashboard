import { getClient } from '@/lib/clients'
import { getWaConversations } from '@/lib/queries'
import { notFound } from 'next/navigation'
import InboxView from '@/components/inbox/InboxView'

export const revalidate = 30

export default async function ClientWhatsAppPage({ params }: { params: { client: string } }) {
  const client = await getClient(params.client)
  if (!client) notFound()
  const conversations = await getWaConversations(client.database_url)

  return (
    <>
      {/* Desktop: full height */}
      <div className="hidden md:block" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <InboxView
          platform="whatsapp"
          initialConversations={conversations}
          clientSlug={params.client}
          waWebhook={client.wa_webhook}
          botToggleWebhook={client.bot_toggle_webhook}
        />
      </div>
      {/* Mobile: natural height */}
      <div className="block md:hidden" style={{ height: 'calc(100vh - 56px - 64px)' }}>
        <InboxView
          platform="whatsapp"
          initialConversations={conversations}
          clientSlug={params.client}
          waWebhook={client.wa_webhook}
          botToggleWebhook={client.bot_toggle_webhook}
        />
      </div>
    </>
  )
}
