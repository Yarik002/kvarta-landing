import Image from "next/image";
import { Check } from "lucide-react";
import beansSack from "@/assets/photos/beans-sack.webp";
import { PrefillButton } from "@/components/prefill-button";
import { subscription } from "@/lib/catalog";
import type { RoastSchedule } from "@/lib/schedule";

interface SubscriptionProps {
  schedule: RoastSchedule;
}

export function Subscription({ schedule }: SubscriptionProps) {
  return (
    <section id="subscription" className="defer-layout relative overflow-hidden bg-espresso text-paper-soft">
      <Image
        src={beansSack}
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-25"
        style={{ objectPosition: "72% 50%" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, #221b16 0%, rgba(34,27,22,0.96) 48%, rgba(34,27,22,0.55) 100%)",
        }}
      />

      <div className="wrap section relative grid gap-12 lg:grid-cols-[1.06fr_0.94fr] lg:gap-16">
        <div>
          <p className="eyebrow text-ochre">04 · подписка</p>
          <h2 className="display-2 mt-5 max-w-[20ch] text-paper-soft">
            Две пачки в месяц — и не думать, что заканчивается.
          </h2>
          <p className="mt-5 max-w-[36rem] text-[1.02rem] leading-relaxed text-paper-soft/80">
            Подписка для тех, кто пьёт кофе каждый день и не хочет каждую неделю вспоминать про
            заказ. Выбираем сорта вместе, привозим в пятницу после обжарки, паузу ставим по одному
            сообщению.
          </p>

          <ul className="mt-7 space-y-3.5">
            {subscription.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-paper-soft/90">
                <Check aria-hidden="true" className="mt-1 shrink-0 text-ochre" size={16} strokeWidth={2.25} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-paper-soft/20 pt-6">
            <div>
              <p className="font-display text-[2.6rem] leading-none text-paper-soft">
                {subscription.priceByn}
                <span className="ml-2 font-sans text-sm font-semibold tracking-[0.14em] text-ochre uppercase">
                  {subscription.unit}
                </span>
              </p>
              <p className="mt-2 text-xs text-paper-soft/65">Доставка по Минску включена</p>
            </div>
            <PrefillButton
              interest="subscription"
              comment="Хочу оформить подписку: две пачки в месяц."
              className="btn btn-light"
            >
              Оформить подписку
            </PrefillButton>
          </div>
        </div>

        <div className="self-start border border-paper-soft/20 bg-[#2a221c] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[0.66rem] font-semibold tracking-[0.18em] text-paper-soft/60 uppercase">
              как это работает
            </p>
            <span className="stamp stamp--ochre">без обязательств</span>
          </div>

          <ol className="mt-6 space-y-6">
            {subscription.steps.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[auto_1fr] gap-4">
                <span className="font-display text-lg leading-none text-ochre">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-[1.08rem] leading-snug text-paper-soft">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-paper-soft/70">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-7 border-t border-paper-soft/15 pt-4 text-xs leading-relaxed text-paper-soft/60">
            {schedule.isRoastToday
              ? "Сегодня четверг — первая доставка приедет в следующую пятницу."
              : `Ближайшая обжарка — четверг, ${schedule.roastDateLabel}. Подписку можно оформить до среды, ${schedule.orderDeadlineLabel}.`}
          </p>
        </div>
      </div>
    </section>
  );
}
