import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import heroPhoto from "@/assets/photos/hero-roaster.webp";
import { RoundStamp } from "@/components/round-stamp";
import type { RoastSchedule } from "@/lib/schedule";
import { site } from "@/lib/site";

interface HeroProps {
  schedule: RoastSchedule;
}

export function Hero({ schedule }: HeroProps) {
  const roastLine = schedule.isRoastToday
    ? "сегодня, четверг"
    : `четверг, ${schedule.roastDateLabel}`;

  return (
    <section id="top" className="relative overflow-hidden pt-10 pb-14 sm:pt-14 lg:pt-16">
      <div className="wrap grid items-start gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <div className="max-w-[40rem]">
          <p className="eyebrow">крафтовая обжарка · Минск · с 2019</p>

          <h1 className="display-1 mt-5">
            Кофе, который ещё <span className="brush-underline">помнит четверг</span>.
          </h1>

          <p className="lede mt-6 max-w-[33rem]">
            Обжариваем маленькими партиями по 5 кг. В четверг — у ростера, в пятницу — уже у вас на
            кухне. Без складов, долгих путешествий и кофе, который «дозрел» на полке.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#catalog" className="btn btn-primary">
              Выбрать кофе
              <ArrowRight aria-hidden="true" size={18} strokeWidth={1.75} />
            </a>
            <a href="#story" className="btn btn-outline">
              Наша история
            </a>
          </div>

          <div className="mt-10 border-t border-rule pt-6">
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <div>
                <dt className="text-[0.62rem] font-semibold tracking-[0.18em] text-ink-mute uppercase">
                  ближайшая обжарка
                </dt>
                <dd className="mt-1 font-display text-xl leading-tight">{roastLine}</dd>
              </div>
              <div>
                <dt className="text-[0.62rem] font-semibold tracking-[0.18em] text-ink-mute uppercase">
                  развозка по Минску
                </dt>
                <dd className="mt-1 font-display text-xl leading-tight">
                  пятница, {schedule.deliveryDateLabel}
                </dd>
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-mute">
              <MapPin aria-hidden="true" className="mt-0.5 shrink-0" size={14} strokeWidth={1.75} />
              <span>
                Самовывоз: {site.address.full}. Доставка по городу — по пятницам, от{" "}
                {site.delivery.freeFromByn} BYN бесплатно.
              </span>
            </p>
          </div>
        </div>

        <figure className="relative">
          <div className="photo-frame aspect-[4/3] sm:aspect-[4/5]">
            <Image
              src={heroPhoto}
              alt="Дмитрий пересыпает свежеобжаренное зерно из ростер-барабана на охлаждающий лоток"
              fill
              priority
              sizes="(min-width: 1024px) 44vw, 92vw"
              className="object-cover"
              placeholder="blur"
            />
          </div>

          <div className="absolute -left-5 top-6 hidden h-28 w-28 items-center justify-center rounded-full border border-rule bg-paper sm:flex">
            <RoundStamp className="h-24 w-24 text-terracotta-deep" />
          </div>

          <figcaption className="mt-3 flex items-start justify-between gap-4 text-xs leading-relaxed text-ink-mute">
            <span>Дмитрий у ростера. Четверг, 7:40 утра.</span>
            <span className="mt-0.5 shrink-0 text-[0.62rem] font-semibold tracking-[0.16em] text-terracotta-deep uppercase">
              партия поехала
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
