import Image from "next/image";
import { ArrowUpRight, Clock, MapPin, Truck } from "lucide-react";
import bagPhoto from "@/assets/photos/bag-grinder.webp";
import type { RoastSchedule } from "@/lib/schedule";
import { site } from "@/lib/site";

interface DeliveryProps {
  schedule: RoastSchedule;
}

export function Delivery({ schedule }: DeliveryProps) {
  const deadlineLine = schedule.isRoastToday
    ? "Сегодняшняя партия уже обжаривается — заказы, оставленные сейчас, поедут в следующую пятницу."
    : `Заказы на эту обжарку принимаем до среды, ${schedule.orderDeadlineLabel}, 20:00. В четверг обжариваем — в пятницу привозим.`;

  return (
    <section id="delivery" className="section defer-layout border-b border-rule bg-paper-soft">
      <div className="wrap">
        <div className="max-w-[46rem]">
          <p className="eyebrow">05 · доставка и самовывоз</p>
          <h2 className="display-2 mt-5">Забрать на Короля или дождаться пятницы</h2>
          <p className="lede mt-4">
            Мы маленькие, поэтому не притворяемся службой доставки. Всё честно: самовывоз — в любой
            рабочий день, доставка — раз в неделю, по Минску, после обжарки.
          </p>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-2">
          <div className="paper-card flex flex-col p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-rule-strong text-terracotta-deep">
                <MapPin aria-hidden="true" size={18} strokeWidth={1.75} />
              </span>
              <h3 className="display-3">Самовывоз</h3>
            </div>

            <p className="mt-5 text-[1.05rem] leading-relaxed text-ink">
              {site.address.city}, {site.address.street}
              <span className="mt-1 block text-sm text-ink-mute">{site.address.note}</span>
            </p>

            <dl className="mt-5 space-y-2 border-t border-rule pt-4 text-sm">
              {site.hours.map((row) => (
                <div key={row.days} className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-mute">{row.days}</dt>
                  <dd className="font-semibold tabular-nums">{row.time}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-auto pt-5">
              <a
                href={site.address.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="link-underline inline-flex items-center gap-1.5 text-sm font-semibold"
              >
                Открыть на карте
                <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.75} />
              </a>
            </div>
          </div>

          <div className="paper-card flex flex-col p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-rule-strong text-terracotta-deep">
                <Truck aria-hidden="true" size={18} strokeWidth={1.75} />
              </span>
              <h3 className="display-3">Доставка по Минску</h3>
            </div>

            <p className="mt-5 text-[1.05rem] leading-relaxed text-ink">
              Каждую пятницу — после обжарки. От {site.delivery.freeFromByn} BYN бесплатно, меньше —
              договоримся о курьере при звонке.
            </p>

            <p className="mt-4 flex items-start gap-2.5 border-t border-rule pt-4 text-sm leading-relaxed text-ink-soft">
              <Clock aria-hidden="true" className="mt-0.5 shrink-0 text-terracotta-deep" size={16} strokeWidth={1.75} />
              <span>{deadlineLine}</span>
            </p>

            <p className="mt-auto pt-5 text-xs leading-relaxed text-ink-mute">
              Нужно раньше пятницы или не в Минск — напишите в Telegram, поищем вариант.
            </p>
          </div>
        </div>

        <div className="mt-4 grid items-center gap-6 border-t border-rule pt-8 sm:grid-cols-[0.8fr_1.2fr] sm:gap-10">
          <div className="photo-frame aspect-[4/3]">
            <Image
              src={bagPhoto}
              alt="Пачка кофе, кофемолка и чашка на деревянной стойке в мастерской"
              fill
              sizes="(min-width: 640px) 32vw, 92vw"
              className="object-cover"
              placeholder="blur"
            />
          </div>
          <div>
            <h3 className="display-3">Молотый или в зёрнах?</h3>
            <p className="mt-3 max-w-[36rem] text-sm leading-relaxed text-ink-soft">
              В зёрнах кофе живёт дольше и пахнет лучше. Но если кофемолки нет — смелем под ваш
              способ: «в воронку», «в рожок» или «в турку». Просто напишите в комментарии к заявке,
              мы не забудем.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <li className="flex items-baseline gap-2">
                <span className="font-display text-lg text-terracotta">1–3</span>
                <span className="text-ink-mute">день после обжарки</span>
              </li>
              <li className="flex items-baseline gap-2">
                <span className="font-display text-lg text-terracotta">5 кг</span>
                <span className="text-ink-mute">размер партии</span>
              </li>
              <li className="flex items-baseline gap-2">
                <span className="font-display text-lg text-terracotta">пт</span>
                <span className="text-ink-mute">день доставки</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
