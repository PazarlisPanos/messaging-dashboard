import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getClient } from '@/lib/clients'
import MobileLayout from '@/components/layout/MobileLayout'
import DesktopLayout from '@/components/layout/DesktopLayout'

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { client: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  const role = (session.user as any).role as string
  const userClientSlug = (session.user as any).clientSlug as string | null

  if (role === 'operator' && userClientSlug !== params.client) {
    redirect(`/dashboard/${userClientSlug}`)
  }

  const client = await getClient(params.client)
  if (!client) notFound()

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex h-screen overflow-hidden bg-[#0a0a0f]">
        <DesktopLayout clientSlug={params.client} clientName={client.name} role={role}>
          {children}
        </DesktopLayout>
      </div>
      {/* Mobile */}
      <div className="flex md:hidden min-h-screen flex-col bg-[#0a0a0f]">
        <MobileLayout clientSlug={params.client} clientName={client.name} role={role}>
          {children}
        </MobileLayout>
      </div>
    </>
  )
}
