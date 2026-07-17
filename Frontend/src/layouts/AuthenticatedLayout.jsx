import AppShell from '../components/layout/AppShell.jsx'

export default function AuthenticatedLayout({
  activePath = '/dashboard',
  children,
  frameClassName = '',
  mainClassName = '',
}) {
  return (
    <AppShell activePath={activePath} frameClassName={frameClassName} mainClassName={mainClassName}>
      {children}
    </AppShell>
  )
}
