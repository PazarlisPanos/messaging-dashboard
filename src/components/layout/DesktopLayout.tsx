import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface Props {
  children: React.ReactNode
  clientSlug: string
  clientName: string
  role: string
}

export default function DesktopLayout({ children, clientSlug, clientName, role }: Props) {
  return (
    <>
      <Sidebar clientSlug={clientSlug} clientName={clientName} role={role} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar clientName={clientName} />
        <main className="flex-1 overflow-hidden p-6" style={{ display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>
    </>
  )
}
