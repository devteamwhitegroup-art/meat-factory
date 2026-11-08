import { cn } from "@/lib/utils";

export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("block text-[13px] tracking-[0.08em] text-gold-700 uppercase", className)}>
      {children}
    </span>
  );
}

export function SectionHeading({
  kicker,
  title,
  className,
}: {
  kicker?: string;
  title: string;
  className?: string;
}) {
  return (
    <div>
      {kicker && <Kicker>{kicker}</Kicker>}
      <h2
        className={cn(
          "font-heading text-[clamp(34px,3.8vw,52px)] leading-[1.08] font-normal tracking-[-0.01em]",
          kicker && "mt-[18px]",
          className,
        )}
      >
        {title}
      </h2>
    </div>
  );
}

// Scroll a horizontally-scrolling rail so `el` is centred, without moving the page.
export function centerInRail(rail: HTMLElement | null, el: HTMLElement | null | undefined) {
  if (!rail || !el) return;
  rail.scrollTo({ left: el.offsetLeft - (rail.clientWidth - el.offsetWidth) / 2 });
}
