"use client";

import { useState } from "react";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CONTACTS = [
  {
    icon: MapPin,
    label: "Хаяг",
    value: "Дорнод аймаг, Чойбалсангаас зүүн 12 км",
  },
  { icon: Phone, label: "Утас", value: "+976 ____ ____" },
  { icon: Mail, label: "И-мэйл", value: "info@whitegroup.mn" },
];

export function LandingContact() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
    toast.success("Хүсэлт хүлээн авлаа. Бид тантай удахгүй холбогдоно.");
  }

  return (
    <section
      id="contact"
      className="brand-gold-gradient relative scroll-mt-20 overflow-hidden py-16 md:py-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 90% at 80% 10%, rgba(255,255,255,0.22), transparent 55%)",
        }}
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="font-display text-[clamp(26px,3.2vw,38px)] leading-[1.12] font-extrabold text-[#3a2a08]">
            Хамтран ажиллахад бэлэн
          </h2>
          <p className="mt-4 mb-7 max-w-[30em] text-[17px] text-[#5b430f]">
            Захиалга, хамтын ажиллагаа, нийлүүлэлтийн талаар бидэнтэй
            холбогдоорой.
          </p>
          <div className="flex flex-col">
            {CONTACTS.map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-3.5 border-b border-[#3a2a08]/15 py-3.5 last:border-0"
              >
                <c.icon className="size-5 flex-none text-[#6b4f12]" />
                <div>
                  <div className="text-xs font-bold tracking-[0.12em] text-[#7c5d18] uppercase">
                    {c.label}
                  </div>
                  <div className="text-base font-semibold text-[#3a2a08]">
                    {c.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-7 shadow-[0_30px_60px_-28px_rgba(120,86,12,0.6)] sm:p-9">
          <h3 className="mb-5 text-lg font-extrabold text-brand-ink">
            Хүсэлт илгээх
          </h3>
          <form onSubmit={onSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Нэр</Label>
              <Input id="c-name" placeholder="Таны нэр" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-contact">Утас / И-мэйл</Label>
              <Input
                id="c-contact"
                placeholder="Холбоо барих мэдээлэл"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-msg">Захиалга / зурвас</Label>
              <Textarea id="c-msg" rows={3} placeholder="Таны хүсэлт..." />
            </div>
            <Button
              type="submit"
              disabled={sent}
              className="h-12 w-full rounded-full bg-brand-ink text-[15px] text-white hover:bg-black"
            >
              {sent ? "Баярлалаа ✓" : "Илгээх"}
              {!sent && <ArrowRight className="size-4" />}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
