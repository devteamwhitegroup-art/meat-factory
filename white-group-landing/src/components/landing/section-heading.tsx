export function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-9 max-w-2xl md:mb-12">
      <span className="mb-3.5 inline-flex items-center text-xs font-bold tracking-[0.18em] text-brand-gold uppercase">
        <span className="mr-2.5 inline-block h-0.5 w-6 bg-brand-gold align-middle" />
        {kicker}
      </span>
      <h2 className="font-display text-[clamp(26px,3.3vw,38px)] leading-[1.12] font-extrabold tracking-tight text-brand-ink">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[17px] text-brand-muted">{description}</p>
      )}
    </div>
  );
}
