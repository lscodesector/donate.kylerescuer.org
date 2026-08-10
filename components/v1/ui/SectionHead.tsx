import type { ComponentType, ReactNode, SVGProps } from "react";
import { Reveal } from "./Reveal";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

export function SectionHead({
  icon: Icon,
  eyebrow,
  title,
  lead,
  tone = "light",
  align = "center",
  className = "",
}: {
  icon: IconComponent;
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  tone?: "light" | "onDark";
  align?: "left" | "center";
  className?: string;
}) {
  const chip = tone === "onDark" ? "bg-white/[.18] text-white" : "bg-accent-soft text-accent";
  const titleColor = tone === "onDark" ? "text-white" : "text-ink-900";
  const leadColor = tone === "onDark" ? "text-white/80" : "text-ink-600";
  const eyebrowColor = tone === "onDark" ? "text-white/70" : "text-accent";
  const centered = align === "center";

  return (
    <Reveal className={`flex flex-col gap-3 ${centered ? "items-center text-center" : ""} ${className}`}>
      <div className={`flex items-center gap-3 ${centered ? "flex-col" : ""}`}>
        <span className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-sm ${chip}`}>
          <Icon size={22} />
        </span>
        <div className={centered ? "flex flex-col items-center gap-1" : "flex flex-col gap-1"}>
          {eyebrow && (
            <p className={`text-[13px] font-extrabold uppercase tracking-[0.12em] ${eyebrowColor}`}>
              {eyebrow}
            </p>
          )}
          <h2
          className={`text-[clamp(1.375rem,1.05rem+1.3vw,2.125rem)] font-extrabold leading-[1.15] ${titleColor}`}
        >
          {title}
        </h2>
        </div>
      </div>

      {lead && (
        <p className={`max-w-[62ch] text-[16px] leading-[1.6] ${centered ? "mx-auto" : ""} ${leadColor}`}>
          {lead}
        </p>
      )}
    </Reveal>
  );
}
