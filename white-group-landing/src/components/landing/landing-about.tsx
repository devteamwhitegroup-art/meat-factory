import { Card } from "@/components/ui/card";
import { ABOUT_CHIPS } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingAbout() {
  return (
    <section id="about" className="scroll-mt-20 py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <SectionHeading
          kicker="Танилцуулга"
          title="Найдвартай гарал үүсэл, тогтвортой нийлүүлэлт"
        />
        <div className="grid items-start gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-14">
          <div className="space-y-4 text-[17px] text-brand-ink-2">
            <p>
              “Вайт групп” ХХК нь анх 2008 оноос түүхий эд, 2010 оноос
              өнөөдрийг хүртэл мал, мах, малын гаралтай бүтээгдэхүүн бэлтгэх
              чиглэлээр дотоодын зах зээлд тогтвортой үйл ажиллагаа явуулж байна.
            </p>
            <p>
              Манай компани Дорнод, Сүхбаатар аймгуудаас голчлон мал, мах
              бэлтгэлээ хийж, дотоодын хэрэглэгчдийн хэрэгцээ, зах зээл мөн
              экспортын эрхтэй үйлдвэрүүдэд бэлтгэн нийлүүлдэг.
            </p>
            <p>
              Махны амт, чанарын хувьд судлаачид, хэрэглэгчдийн таашаал хүртсэн,
              эрэлт хэрэгцээ ихтэй бүтээгдэхүүн билээ.
            </p>
          </div>
          <div className="flex flex-col gap-3.5">
            {ABOUT_CHIPS.map((chip) => (
              <Card
                key={chip.title}
                className="flex-row items-start gap-4 rounded-2xl bg-white p-5 ring-brand-line"
              >
                <div className="grid size-11 flex-none place-items-center rounded-xl bg-gradient-to-br from-[#f3e7c4] to-[#e7cf86] text-brand-gold-deep">
                  <chip.icon className="size-5.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-ink">
                    {chip.title}
                  </h3>
                  <span className="text-sm text-brand-muted">{chip.desc}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
