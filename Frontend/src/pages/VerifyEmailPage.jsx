import AuthLayout from '../components/auth/AuthLayout.jsx'
import VerifyEmailForm from '../components/auth/VerifyEmailForm.jsx'

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <section
        className="w-full max-w-[620px] rounded-[28px] border border-slate-200/90 bg-white/95 px-5 py-7 shadow-[0_24px_60px_rgba(74,102,170,0.18)] backdrop-blur-[6px] sm:px-[34px] sm:py-[30px]"
        aria-labelledby="verify-email-title"
      >
        <div className="mb-[22px] flex items-center justify-center gap-3 sm:gap-[14px]">
          <div className="relative h-[42px] w-[42px]" aria-hidden="true">
            <span className="absolute left-3 top-0 h-[18px] w-[18px] rotate-45 rounded-[4px] bg-linear-to-br from-[#4d73ff] to-[#2d5bff]" />
            <span className="absolute left-0 top-3 h-[18px] w-[18px] rotate-45 rounded-[4px] bg-linear-to-br from-[#4d73ff] to-[#2d5bff]" />
            <span className="absolute bottom-0 right-0 h-[18px] w-[18px] rotate-45 rounded-[4px] bg-linear-to-br from-[#4d73ff] to-[#2d5bff]" />
          </div>
          <p className="m-0 text-[2.55rem] font-extrabold leading-none text-slate-900 max-[480px]:text-[2.15rem]">
            Jira<span className="text-[#2d5bff]">Lite</span>
          </p>
        </div>

        <h1
          id="verify-email-title"
          className="m-0 text-center text-[2.25rem] font-extrabold leading-[1.1] text-slate-900 max-[480px]:text-[1.85rem]"
        >
          Verify your email
        </h1>
        <p className="mb-7 mt-3 text-center text-[1rem] leading-[1.6] text-slate-500">
          Enter the verification code or token sent to your email address.
        </p>

        <VerifyEmailForm />
      </section>
    </AuthLayout>
  )
}
