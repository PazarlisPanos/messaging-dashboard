import { getClient } from '@/lib/clients'
import { getVbConversations } from '@/lib/queries'
import { notFound } from 'next/navigation'
import InboxView from '@/components/inbox/InboxView'

export const revalidate = 30

export default async function ClientViberPage({ params }: { params: { client: string } }) {
  const client = await getClient(params.client)
  if (!client) notFound()
  const conversations = await getVbConversations(client.database_url)

  return (
    <>
      <div className="hidden md:block" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <InboxView
          platform="viber"
          initialConversations={conversations}
          clientSlug={params.client}
          vbWebhook={client.vb_webhook}
          botToggleWebhook={client.bot_toggle_webhook}
        />
      </div>
      <div className="block md:hidden" style={{ height: 'calc(100vh - 56px - 64px)' }}>
        <InboxView
          platform="viber"
          initialConversations={conversations}
          clientSlug={params.client}
          vbWebhook={client.vb_webhook}
          botToggleWebhook={client.bot_toggle_webhook}
        />
      </div>
    </>
  )
}
