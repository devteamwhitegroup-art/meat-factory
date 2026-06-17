import { Card } from "@/components/ui/card";
import { PARTNERS, SOCIAL_STATS } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingPartners() {
  return (
    <section id="partners" className="scroll-mt-20 py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <SectionHeading
          kicker="Хамтрагчид ба хэрэглэгчид"
          title="Итгэлээ хүлээлгэсэн түншүүд"
        />
        <div className="grid gap-12 md:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-3.5 sm:grid-cols-2">
            {PARTNERS.map((p) => (
              <Card
                key={p.name}
                className="flex-row items-center gap-3.5 rounded-2xl bg-white p-5 ring-brand-line"
              >
                <div className="grid size-10 flex-none place-items-center rounded-xl bg-brand-cream-2 font-display text-[15px] font-extrabold text-brand-gold-deep">
                  {p.code}
                </div>
                <div>
                  <b className="text-[15px] font-semibold text-brand-ink">
                    {p.name}
                  </b>
                  {p.sub && (
                    <span className="block text-[13px] text-brand-muted">
                      {p.sub}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Card className="gap-0 rounded-2xl bg-brand-ink p-8 ring-0 text-white">
            <h3 className="text-lg font-extrabold">Нийгмийн хариуцлага</h3>
            <p className="mt-1.5 mb-6 text-[14.5px] text-white/65">
              Үндсэн ажлын байр бий болгож, орон нутгийн хөгжилд хувь нэмрээ
              оруулж байна.
            </p>
            {SOCIAL_STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-baseline gap-3 border-t border-white/10 py-4"
              >
                <span className="font-display text-3xl font-extrabold text-brand-gold-bright">
                  {s.value}
                </span>
                <span className="text-sm text-white/80">{s.label}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </section>
  );
}
