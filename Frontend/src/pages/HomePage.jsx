import homeHeroImage from '../assets/HomePage.jpg'
import PublicNavbar from '../components/layout/PublicNavbar.jsx'
import { navigateTo } from '../utils/navigation.js'

const features = [
  {
    title: 'Project Creation',
    description: 'Create and organize projects in minutes with flexible templates.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7.5h6l1.8 2H20v9H4z" />
        <path d="M12 13.5h4.5" />
        <path d="M14.25 11.25v4.5" />
      </svg>
    ),
  },
  {
    title: 'Task Assignment',
    description: 'Assign tasks, set deadlines, and prioritize work with ease.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M15.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
        <path d="M3.75 19.25a4.75 4.75 0 0 1 9.5 0" />
        <path d="M13.75 17.5a4 4 0 0 1 6.5 1.75" />
      </svg>
    ),
  },
  {
    title: 'Team Collaboration',
    description: 'Communicate, share files, and collaborate in real time.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6.5h14v9H9l-4 3.25z" />
        <path d="M8.5 11h.01" />
        <path d="M12 11h.01" />
        <path d="M15.5 11h.01" />
      </svg>
    ),
  },
  {
    title: 'Progress Tracking',
    description: 'Track progress with clear dashboards and real-time updates.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19h14" />
        <path d="M7.5 16v-4" />
        <path d="M12 16V8" />
        <path d="M16.5 16V5" />
      </svg>
    ),
  },
]

const steps = [
  {
    title: 'Create Project',
    description: 'Set up your project in seconds and define your goals.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7.5h6l1.8 2H20v9H4z" />
        <path d="M12 13.5h4.5" />
        <path d="M14.25 11.25v4.5" />
      </svg>
    ),
  },
  {
    title: 'Invite Team',
    description: 'Invite your team members and assign roles to get everyone on board.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M16 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
        <path d="M3.75 19.25a4.75 4.75 0 0 1 9.5 0" />
        <path d="M14 18.75h6.25" />
      </svg>
    ),
  },
  {
    title: 'Track Progress',
    description: 'Monitor tasks, celebrate wins, and keep your project on track.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19h14" />
        <path d="M7 15.5l4-4 3 2.75 4.5-6" />
        <path d="M18.5 8.25V13h-4.75" />
      </svg>
    ),
  },
]

export default function HomePage() {
  const signupPath = '/signup'

  return (
    <>
      <PublicNavbar actionLabel="Signup" actionPath={signupPath} />
      <main className="min-h-[calc(100vh-64px)] bg-white text-slate-900">
      <section
        id="about"
        className="relative overflow-hidden bg-[#061936]"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(3, 16, 37, 0.96) 0%, rgba(5, 20, 45, 0.82) 42%, rgba(5, 20, 45, 0.2) 72%), url(${homeHeroImage})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="mx-auto flex min-h-[430px] w-full max-w-[1180px] items-center px-5 py-16 lg:min-h-[500px] lg:px-6">
          <div className="max-w-[600px]">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-[#4a8cff]">
              Projects that move your team
            </p>
            <h1 className="m-0 text-[clamp(2.2rem,5vw,4.25rem)] font-extrabold leading-[1.08] tracking-normal text-white">
              Fast & Easy Way To Manage Your <span className="text-[#2f6bff]">Projects</span>
            </h1>
            <p className="mt-5 max-w-[480px] text-base font-medium leading-7 text-slate-200 sm:text-lg">
              Plan projects, assign tasks, invite your team, and track progress in one simple workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                className="rounded-lg bg-[#ff684d] px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(255,104,77,0.32)] transition hover:bg-[#f0523a]"
                type="button"
                onClick={() => navigateTo(signupPath)}
              >
                Signup
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto -mt-12 w-full max-w-[1180px] px-5 lg:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-lg border border-slate-200 bg-white p-8 text-center transition hover:shadow-sm"
            >
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#eef4ff] text-[#2f6bff]">
                <span className="h-7 w-7 [&_path]:fill-none [&_path]:stroke-current [&_path]:stroke-[2.2] [&_path]:stroke-linecap-round [&_path]:stroke-linejoin-round">
                  {feature.icon}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-[#14264a]">{feature.title}</h2>
              <p className="mx-auto mt-3 max-w-[220px] text-sm font-medium leading-6 text-slate-500">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-[1040px] px-5 py-20 text-center lg:px-6">
        <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold leading-tight text-[#14264a]">
          How It Works
        </h2>
        <p className="mt-3 text-base font-semibold text-slate-500">Get your project running in 3 simple steps</p>

        <div className="relative mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.title}
              className="rounded-lg border border-slate-200 bg-white p-6 text-left transition hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#2f6bff]">
                  <span className="h-6 w-6 [&_path]:fill-none [&_path]:stroke-current [&_path]:stroke-[2.2] [&_path]:stroke-linecap-round [&_path]:stroke-linejoin-round">
                    {step.icon}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-[#14264a]">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{step.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      </main>
    </>
  )
}
