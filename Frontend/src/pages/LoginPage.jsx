import loginBackground from '../assets/signup & Login.jpg'
import LoginForm from '../components/auth/LoginForm.jsx'
import PublicNavbar from '../components/layout/PublicNavbar.jsx'

const loginBenefits = [
  {
    id: 'manage-projects',
    title: 'Manage your projects',
    description: 'Organize tasks and milestones in one place.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.25 7V5.75A2.25 2.25 0 0 1 10.5 3.5h3A2.25 2.25 0 0 1 15.75 5.75V7" />
        <path d="M4.75 7h14.5v11.5H4.75z" />
        <path d="M9 12.25h6" />
      </svg>
    ),
  },
  {
    id: 'track-progress',
    title: 'Track tasks and progress',
    description: 'Stay updated with real-time progress and insights.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 17.5 9 13l3 2.75 6.5-7.25" />
        <path d="M18.5 8.5v5h-5" />
      </svg>
    ),
  },
  {
    id: 'team-collaboration',
    title: 'Collaborate with your team',
    description: 'Share updates, comments, and files seamlessly.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M16 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
        <path d="M3.75 19.25a4.75 4.75 0 0 1 9.5 0" />
        <path d="M14 18.75h6.25" />
      </svg>
    ),
  },
]

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative h-8 w-8" aria-hidden="true">
        <span className="absolute left-2.5 top-0 h-3.5 w-3.5 rotate-45 rounded-[4px] bg-[#2f6bff]" />
        <span className="absolute left-0 top-2.5 h-3.5 w-3.5 rotate-45 rounded-[4px] bg-[#36a3ff]" />
        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rotate-45 rounded-[4px] bg-[#2f6bff]" />
      </span>
      <p className="m-0 text-xl font-extrabold leading-none text-white">
        Jira<span className="text-[#4a8cff]">Lite</span>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar actionLabel="Signup" actionPath="/signup" />

      <main className="lg:h-[calc(100dvh-64px)] lg:overflow-hidden">
        <div className="grid min-h-[calc(100dvh-64px)] grid-cols-1 lg:h-full lg:min-h-0 lg:grid-cols-2">
          <section className="relative hidden h-full overflow-hidden bg-[#061A43] p-7 text-white lg:block xl:p-10">
            <img
              src={loginBackground}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#061A43]/94 via-[#061A43]/82 to-[#061A43]/42" />

            <div className="relative z-10 flex h-full max-w-[470px] flex-col justify-between gap-6">
              <BrandMark />

              <div className="space-y-4 [@media(max-height:760px)]:space-y-3">
                <h1 className="m-0 text-4xl font-extrabold leading-tight text-white [@media(max-height:760px)]:text-3xl xl:text-5xl">
                  Welcome back!
                </h1>
                <p className="max-w-[390px] text-sm font-medium leading-6 text-slate-200 xl:text-base">
                  Log in to continue managing your projects and collaborating with your team.
                </p>
              </div>

              <div className="grid gap-4 [@media(max-height:760px)]:gap-3">
                {loginBenefits.map((benefit) => (
                  <article className="flex items-start gap-3" key={benefit.id}>
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-[#4a8cff] ring-1 ring-white/10">
                      <span className="h-5 w-5 [&_path]:fill-none [&_path]:stroke-current [&_path]:stroke-[2] [&_path]:stroke-linecap-round [&_path]:stroke-linejoin-round">
                        {benefit.icon}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-white">{benefit.title}</h2>
                      <p className="mt-0.5 max-w-[320px] text-xs font-medium leading-5 text-slate-300 xl:text-sm">
                        {benefit.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center bg-slate-50 px-4 py-4 sm:px-6 lg:h-full">
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [@media(max-height:760px)]:p-5"
              aria-labelledby="login-title"
            >
              <div className="mb-5 text-center [@media(max-height:760px)]:mb-4">
                <h1 id="login-title" className="m-0 text-2xl font-extrabold leading-tight text-[#061A43]">
                  Login to your account
                </h1>
                <p className="mt-1.5 text-sm font-medium text-slate-500">
                  Enter your credentials to access your workspace.
                </p>
              </div>

              <LoginForm />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
