export default function AuthLayout({ children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(236,244,255,0.92)_44%,rgba(225,236,255,0.96)_100%),linear-gradient(180deg,#f8fbff_0%,#edf4ff_100%)]">
      <div
        className="absolute -right-[120px] -top-[160px] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(110,150,255,0.28)_0%,rgba(110,150,255,0.08)_55%,rgba(110,150,255,0)_72%)] blur-[4px]"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-[160px] -left-[130px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(110,150,255,0.28)_0%,rgba(110,150,255,0.08)_55%,rgba(110,150,255,0)_72%)] blur-[4px]"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-12 right-[-40px] h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(110,150,255,0.28)_0%,rgba(110,150,255,0.08)_55%,rgba(110,150,255,0)_72%)] opacity-40 blur-[4px]"
        aria-hidden="true"
      />
      <div
        className="absolute left-[26px] top-[92px] h-28 w-28 bg-[radial-gradient(circle,rgba(103,132,223,0.2)_1.7px,transparent_1.7px)] [background-size:14px_14px]"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[34px] right-[18px] h-28 w-28 bg-[radial-gradient(circle,rgba(103,132,223,0.2)_1.7px,transparent_1.7px)] [background-size:14px_14px] max-md:bottom-2 max-md:right-[-10px]"
        aria-hidden="true"
      />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-7 sm:px-5 sm:py-10">
        {children}
      </div>
    </main>
  )
}
