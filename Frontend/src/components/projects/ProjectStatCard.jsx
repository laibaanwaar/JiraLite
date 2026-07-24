const ProjectStatCard = ({
  label = "",
  value = 0,
  icon = null,
  iconClass = "bg-indigo-50 text-[#3563E9]",
}) => {
  return (
    <div
      className="
        w-full
        rounded-[16px]
        border
        border-slate-200
        bg-white
        px-5
        py-4
        shadow-[0_4px_14px_rgba(15,30,51,0.05)]
        transition-all
        duration-300
        hover:shadow-[0_8px_22px_rgba(15,30,51,0.08)]
      "
    >
      <div className="flex items-center justify-between gap-4">

        {/* LEFT SIDE */}

        <div className="min-w-0">
          <p
            className="
              text-xs
              font-bold
              uppercase
              tracking-[0.05em]
              text-slate-500
            "
          >
            {label}
          </p>

          <p
            className="
              mt-2
              text-3xl
              font-black
              leading-none
              text-[#14223A]
            "
          >
            {value ?? 0}
          </p>
        </div>

        {/* ICON */}

        {icon && (
          <div
            className={`
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-xl
              font-bold
              ${iconClass}
            `}
          >
            {icon}
          </div>
        )}

      </div>
    </div>
  );
};

export default ProjectStatCard;