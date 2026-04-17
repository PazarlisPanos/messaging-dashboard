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
      <div className="hidden md:block" style={{ height: 'calc(100vh - 3.5rem - 3rem - 3rem)', overflow: 'hidden' }}>
        <InboxView
          platform="whatsapp"
          initialConversations={conversations}
          clientSlug={params.client}
          waWebhook={client.wa_webhook}
          botToggleWebhook={client.bot_toggle_webhook}
          resolveAttentionWebhook={client.resolve_attention_webhook}
        />
      </div>
      <div className="block md:hidden" style={{ height: '100%' }}>
        <InboxView
          platform="whatsapp"
          initialConversations={conversations}
          clientSlug={params.client}
          waWebhook={client.wa_webhook}
          botToggleWebhook={client.bot_toggle_webhook}
          resolveAttentionWebhook={client.resolve_attention_webhook}
        />
      </div>
    </>
  )
}
