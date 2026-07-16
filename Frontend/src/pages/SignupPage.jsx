import AuthLayout from '../components/auth/AuthLayout.jsx'
import SignupForm from '../components/auth/SignupForm.jsx'

export default function SignupPage() {
  return (
    <AuthLayout>
      <section
        className="w-full max-w-[620px] rounded-[28px] border border-slate-200/90 bg-white/95 px-5 py-7 shadow-[0_24px_60px_rgba(74,102,170,0.18)] backdrop-blur-[6px] sm:px-[34px] sm:py-[30px]"
        aria-labelledby="signup-title"
      >
        <div className="mb-[22px] flex items-center justify-center gap-3 sm:gap-[14px]">
          <div className="relative h-[42px] w-[42px]" aria-hidden="true">
            <span className="absolute left-3 top-0 h-[18px] w-[18px] rotate-45 rounded-[4px] bg-linear-to-br from-[#4d73ff] to-[#2d5bff]" />
            <span className="absolute left-0 top-3 h-[18px] w-[18px] rotate-45 rounded-[4px] bg-linear-to-br from-[#4d73ff] to-[#2d5bff]" />
            <span className="absolute bottom-0 right-0 h-[18px] w-[18px] rotate-45 rounded-[4px] bg-linear-to-br from-[#4d73ff] to-[#2d5bff]" />
          </div>
          <p className="m-0 text-[clamp(2.2rem,5vw,2.95rem)] font-extrabold leading-none tracking-[-0.045em] text-slate-900">
            Jira<span className="text-[#2d5bff]">Lite</span>
          </p>
        </div>

        <h1
          id="signup-title"
          className="m-0 text-center text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.05em] text-slate-900"
        >
          Create your account
        </h1>
        <p className="mb-7 mt-3 text-center text-[1.03rem] leading-[1.6] text-slate-500">
          Sign up to start managing projects and tasks.
        </p>

        <SignupForm />
      </section>
    </AuthLayout>
  )
}
