const FeatureCard = ({
  icon,
  iconBackground,
  title,
  description,
}) => {
  return (
    <article
      className="group h-full"
      style={{
        perspective: "1000px",
      }}
    >
      <div
        className="relative h-full overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-6 shadow-[0_14px_45px_rgba(23,43,77,0.08)] transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-[0_30px_65px_rgba(12,102,228,0.17)]"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Decorative gradient */}
        <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full bg-blue-100/40 blur-2xl transition-all duration-500 group-hover:scale-150" />

        <div className="relative z-10 flex gap-5">
          {/* Icon */}
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-inner transition-all duration-500 group-hover:-rotate-6 group-hover:scale-110 ${iconBackground}`}
          >
            {icon}
          </div>

          {/* Text */}
          <div>
            <h3 className="text-[18px] font-extrabold text-[#172B4D]">
              {title}
            </h3>

            <p className="mt-2 text-[14px] leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>

        {/* Blue hover line */}
        <div className="absolute bottom-0 left-6 right-6 h-[3px] origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#0C66E4] to-[#579DFF] transition-transform duration-500 group-hover:scale-x-100" />
      </div>
    </article>
  );
};

export default FeatureCard;