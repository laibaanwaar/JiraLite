import authBackground from '../assets/signup & Login.jpg'
import VerifyEmailForm from '../components/auth/VerifyEmailForm.jsx'
import PublicNavbar from '../components/layout/PublicNavbar.jsx'

const verificationPoints = [
  {
    id: 'secure',
    title: 'Secure account verification',
    description: 'Confirm that this email belongs to you before accessing JiraLite.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5 19 6v5.25c0 4.1-2.75 7.2-7 9.25-4.25-2.05-7-5.15-7-9.25V6z" />
        <path d="m8.75 12.25 2.2 2.2 4.6-5.1" />
      </svg>
    ),
  },
  {
    id: 'expires',
    title: 'Code expires soon',
    description: 'Use the latest code from your inbox for a successful verification.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 6v6l3.5 2" />
        <path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
      </svg>
    ),
  },
  {
    id: 'resend',
    title: 'Request a new code',
    description: 'If the code is missing or expired, resend it from this page.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L19.5 9" />
        <path d="M19.5 4.5V9H15" />
        <path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4.5 15" />
        <path d="M4.5 19.5V15H9" />
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

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar actionLabel="Login" actionPath="/login" />

      <main className="lg:h-[calc(100dvh-64px)] lg:overflow-hidden">
        <div className="grid min-h-[calc(100dvh-64px)] grid-cols-1 lg:h-full lg:min-h-0 lg:grid-cols-2">
          <section className="relative hidden h-full overflow-hidden bg-[#061A43] p-7 text-white lg:block xl:p-10">
            <img
              src={authBackground}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#061A43]/94 via-[#061A43]/82 to-[#061A43]/42" />

            <div className="relative z-10 flex h-full max-w-[470px] flex-col justify-between gap-6">
              <BrandMark />

              <div className="space-y-4 [@media(max-height:760px)]:space-y-3">
                <h1 className="m-0 text-4xl font-extrabold leading-tight text-white [@media(max-height:760px)]:text-3xl xl:text-5xl">
                  Verify your email
                </h1>
                <p className="max-w-[410px] text-sm font-medium leading-6 text-slate-200 xl:text-base">
                  We sent a verification code to your email address. Enter the code to activate your JiraLite account.
                </p>
              </div>

              <div className="grid gap-4 [@media(max-height:760px)]:gap-3">
                {verificationPoints.map((point) => (
                  <article className="flex items-start gap-3" key={point.id}>
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-[#4a8cff] ring-1 ring-white/10">
                      <span className="h-5 w-5 [&_path]:fill-none [&_path]:stroke-current [&_path]:stroke-[2] [&_path]:stroke-linecap-round [&_path]:stroke-linejoin-round">
                        {point.icon}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-white">{point.title}</h2>
                      <p className="mt-0.5 max-w-[340px] text-xs font-medium leading-5 text-slate-300 xl:text-sm">
                        {point.description}
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
              aria-labelledby="verify-email-title"
            >
              <VerifyEmailForm />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
