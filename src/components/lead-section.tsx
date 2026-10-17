import { ArrowUpRight, Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { LeadForm } from "@/components/lead-form";
import type { RoastSchedule } from "@/lib/schedule";
import { site } from "@/lib/site";

interface LeadSectionProps {
  schedule: RoastSchedule;
}

export function LeadSection({ schedule }: LeadSectionProps) {
  return (
    <section id="lead" className="section defer-layout bg-paper-deep/45">
      <div className="wrap grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        <div>
          <p className="eyebrow">07 · заявка</p>
          <h2 className="display-2 mt-5 max-w-[16ch]">Напишите нам</h2>
          <p className="lede mt-5 max-w-[33rem]">
            Менеджер перезвонит с 10 до 20 по Минску, подскажет по сортам и помолу. Если не любите
            звонки — поставьте в комментарии «только Telegram», так и сделаем.
          </p>

          <ul className="mt-8 space-y-4 border-t border-rule pt-6">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule-strong text-terracotta-deep">
                <Phone aria-hidden="true" size={16} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-ink-mute uppercase">
                  телефон
                </p>
                <a href={site.contacts.phoneHref} className="link-underline text-[1.02rem] font-semibold">
                  {site.contacts.phoneDisplay}
                </a>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule-strong text-terracotta-deep">
                <MessageCircle aria-hidden="true" size={16} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-ink-mute uppercase">
                  telegram
                </p>
                <a
                  href={site.contacts.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline inline-flex items-center gap-1.5 text-[1.02rem] font-semibold"
                >
                  {site.contacts.telegramLabel}
                  <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.75} />
                </a>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule-strong text-terracotta-deep">
                <MapPin aria-hidden="true" size={16} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-ink-mute uppercase">
                  мастерская
                </p>
                <p className="text-[1.02rem] font-semibold">
                  {site.address.city}, {site.address.street}
                </p>
                <p className="text-sm text-ink-mute">{site.address.note}</p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule-strong text-terracotta-deep">
                <Clock aria-hidden="true" size={16} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-ink-mute uppercase">
                  часы
                </p>
                <p className="text-sm">
                  {site.hours.map((row) => `${row.days} ${row.time}`).join(" · ")}
                </p>
              </div>
            </li>
          </ul>

          <p className="mt-6 border-t border-rule pt-5 text-sm leading-relaxed text-ink-soft">
            {schedule.isRoastToday
              ? "Сегодня обжариваем — заявки, оставленные сейчас, попадут в следующую пятницу. Напишите, если нужно срочно: подскажем, что уже есть в наличии."
              : `Заявки на ближайшую обжарку (четверг, ${schedule.roastDateLabel}) принимаем до среды, ${schedule.orderDeadlineLabel}, 20:00.`}
          </p>
        </div>

        <div>
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
