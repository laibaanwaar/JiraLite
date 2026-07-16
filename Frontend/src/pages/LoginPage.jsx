import AuthLayout from '../components/auth/AuthLayout.jsx'
import LoginForm from '../components/auth/LoginForm.jsx'

export default function LoginPage() {
  return (
    <AuthLayout>
      <section
        className="w-full max-w-[620px] rounded-[28px] border border-slate-200/90 bg-white/95 px-5 py-9 shadow-[0_24px_60px_rgba(74,102,170,0.18)] backdrop-blur-[6px] sm:px-[64px] sm:py-[42px]"
        aria-labelledby="login-title"
      >
        <div className="mb-12 flex items-center justify-center gap-3">
          <div className="relative h-9 w-9" aria-hidden="true">
            <span className="absolute bottom-1 left-1 h-5 w-2 rounded-sm bg-[#2d5bff]" />
            <span className="absolute bottom-1 left-3.5 h-7 w-2 rounded-sm bg-[#2d5bff]" />
            <span className="absolute bottom-1 left-6 h-8 w-2 rounded-sm bg-[#2d5bff]" />
            <span className="absolute left-0 top-3 h-2 w-4 rounded-full bg-[#2d5bff]" />
          </div>
          <p className="m-0 text-[2rem] font-extrabold leading-none text-slate-900 max-[480px]:text-[1.75rem]">
            Jira<span className="text-[#2d5bff]">Lite</span>
          </p>
        </div>

        <div className="mb-14 text-center">
          <h1
            id="login-title"
            className="m-0 text-[2rem] font-extrabold leading-[1.15] text-slate-900 max-[480px]:text-[1.75rem]"
          >
            Welcome back!
          </h1>
          <p className="mb-0 mt-2 text-[1.05rem] font-semibold text-slate-500">
            Login to your account
          </p>
        </div>

        <LoginForm />
      </section>
    </AuthLayout>
  )
}
