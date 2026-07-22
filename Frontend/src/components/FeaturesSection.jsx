import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: "☷",
    iconBackground: "bg-blue-100 text-[#0C66E4]",
    title: "Plan & Track",
    description:
      "Break down work, set priorities, assign tasks, and track project progress in real time.",
  },
  {
    icon: "♙",
    iconBackground: "bg-emerald-100 text-emerald-600",
    title: "Collaborate",
    description:
      "Bring project admins and members together with clear responsibilities and shared workflows.",
  },
  {
    icon: "↗",
    iconBackground: "bg-violet-100 text-violet-600",
    title: "Deliver Faster",
    description:
      "Keep work organized and help your team move tasks efficiently from planning to completion.",
  },
  {
    icon: "▥",
    iconBackground: "bg-amber-100 text-amber-600",
    title: "Gain Insights",
    description:
      "Use project dashboards to understand task status, progress, and overall team performance.",
  },
];

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[#F7F8FA] py-20 lg:py-24"
    >
      {/* Background */}
      <div className="pointer-events-none absolute -right-32 top-0 h-[450px] w-[450px] rounded-full bg-blue-200/30 blur-[120px]" />

      <div className="pointer-events-none absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-100/40 blur-[120px]" />

      <div className="relative mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#0C66E4] sm:text-sm">
            Everything Your Team Needs
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-[-1.5px] text-[#172B4D] sm:text-5xl">
            Work together.
            <span className="text-[#0C66E4]"> Deliver better.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            JiraLite gives your team a simple workspace to organize projects,
            manage tasks, collaborate, and monitor progress.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              iconBackground={feature.iconBackground}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;