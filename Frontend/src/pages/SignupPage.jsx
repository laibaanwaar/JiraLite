import signupBackground from '../assets/signup & Login.jpg'
import SignupForm from '../components/auth/SignupForm.jsx'
import PublicNavbar from '../components/layout/PublicNavbar.jsx'

const signupBenefits = [
  {
    id: 'free-trial',
    title: 'Free 14-day trial',
    description: 'Explore all features, free for 14 days.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3.75v3" />
        <path d="M17 3.75v3" />
        <path d="M4.75 8.25h14.5" />
        <path d="M5.75 5.25h12.5v14H5.75z" />
        <path d="m8.75 14.25 2 2 4.5-5" />
      </svg>
    ),
  },
  {
    id: 'no-card',
    title: 'No credit card required',
    description: 'Get started instantly. No payment details needed.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.75 6.75h16.5v10.5H3.75z" />
        <path d="M3.75 10h16.5" />
        <path d="M7 14.5h4" />
      </svg>
    ),
  },
  {
    id: 'cancel-anytime',
    title: 'Cancel anytime',
    description: 'No commitments. Cancel at any time, hassle-free.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5 19 6v5.25c0 4.1-2.75 7.2-7 9.25-4.25-2.05-7-5.15-7-9.25V6z" />
        <path d="m8.75 12.25 2.2 2.2 4.6-5.1" />
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

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar actionLabel="Login" actionPath="/login" />

      <main className="px-4 py-2 sm:px-6 lg:h-[calc(100vh-64px)] lg:overflow-hidden lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-80px)] lg:max-h-[540px] lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative order-2 min-h-[300px] overflow-hidden bg-[#061A43] p-5 text-white sm:p-6 lg:order-1 lg:min-h-0">
            <img
              src={signupBackground}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#061A43]/95 via-[#061A43]/84 to-[#061A43]/48" />

            <div className="relative z-10 flex h-full max-w-[480px] flex-col gap-10 lg:gap-8 [@media(max-height:760px)]:gap-6">
              <BrandMark />

              <div>
                <h1 className="m-0 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-[2.35rem] xl:text-[2.55rem] [@media(max-height:760px)]:text-[2.15rem]">
                  Create your account
                </h1>
                <p className="mt-3 max-w-[420px] text-sm font-medium leading-6 text-slate-200 [@media(max-height:760px)]:mt-2">
                  Join JiraLite and simplify the way your team plans, tracks, and delivers work. Start your free trial
                  in minutes with no commitments.
                </p>
              </div>

              <div className="grid gap-3 [@media(max-height:760px)]:gap-2.5">
                {signupBenefits.map((benefit) => (
                  <article className="flex items-start gap-3" key={benefit.id}>
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-[#4a8cff] ring-1 ring-white/10">
                      <span className="h-5 w-5 [&_path]:fill-none [&_path]:stroke-current [&_path]:stroke-[2] [&_path]:stroke-linecap-round [&_path]:stroke-linejoin-round">
                        {benefit.icon}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-white">{benefit.title}</h2>
                      <p className="mt-0.5 max-w-[320px] text-xs font-medium leading-5 text-slate-300">
                        {benefit.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="order-1 flex items-start justify-center p-4 lg:order-2 lg:items-center">
            <div
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              aria-labelledby="signup-title"
            >
              <div className="mb-4 text-center">
                <h2 id="signup-title" className="m-0 text-2xl font-extrabold leading-tight text-[#061A43]">
                  Create your account
                </h2>
                <p className="mt-1.5 text-sm font-medium text-slate-500">
                  Enter your details below to get started.
                </p>
              </div>

              <SignupForm />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
