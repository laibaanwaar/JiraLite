import { navigateTo } from '../../utils/navigation.js'

function Logo() {
  return (
    <button
      className="flex items-center gap-2 text-slate-900"
      type="button"
      onClick={() => navigateTo('/')}
      aria-label="JiraLite home"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef4ff]">
        <span className="relative h-4 w-4 rotate-45 rounded-[4px] border-[3px] border-[#2f6bff]" />
      </span>
      <span className="text-lg font-extrabold tracking-normal">
        Jira<span className="text-[#2f6bff]">Lite</span>
      </span>
    </button>
  )
}

function NavButton({ children, path, variant = 'link' }) {
  const baseClass =
    variant === 'primary'
      ? 'rounded-lg bg-[#061936] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(6,25,54,0.22)] transition hover:bg-[#0b2a58] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6bff]'
      : 'text-sm font-bold text-slate-700 transition hover:text-[#2f6bff] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f6bff]'

  return (
    <button type="button" className={baseClass} onClick={() => navigateTo(path)}>
      {children}
    </button>
  )
}

export default function PublicNavbar({ actionLabel = 'Signup', actionPath = '/signup' }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-5 lg:px-6">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Public navigation"></nav>

        <NavButton path={actionPath} variant="primary">
          {actionLabel}
        </NavButton>
      </div>
    </header>
  )
}
