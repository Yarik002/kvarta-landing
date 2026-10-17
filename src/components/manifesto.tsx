import Image from "next/image";
import brewPhoto from "@/assets/photos/brew-pour.webp";

const points = [
  {
    number: "01",
    title: "Обжариваем раз в неделю",
    text: "Не «по мере заказов». В четверг мы загружаем ростер и доводим профиль до конца — даже когда партия маленькая. Так вкус получается одинаковым от недели к неделе.",
  },
  {
    number: "02",
    title: "Отдаём на 1–3 день",
    text: "После обжарки кофе должен отдохнуть: уходит лишний углекислый газ, вкус становится чище. Раньше — резко, позже — уже пыльно. Мы ловим эти три дня.",
  },
  {
    number: "03",
    title: "Пишем дату на пачке",
    text: "И отвечаем за неё. Если зерно приехало не свежим или что-то пошло не так — напишите, разберёмся без споров и «условий возврата».",
  },
];

export function Manifesto() {
  return (
    <section id="freshness" className="section defer-layout border-b border-rule bg-paper-soft">
      <div className="wrap grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        <div className="flex flex-col gap-4 self-start lg:sticky lg:top-32">
          <div className="photo-frame aspect-[4/5]">
            <Image
              src={brewPhoto}
              alt="Воронка с бумажным фильтром и чайник с горячей водой — процесс заваривания фильтр-кофе"
              fill
              sizes="(min-width: 1024px) 36vw, 92vw"
              className="object-cover"
              placeholder="blur"
            />
          </div>
          <p className="text-xs leading-relaxed text-ink-mute">
            Утро в мастерской: пока Аня заваривает, Дмитрий проверяет вчерашнюю партию на весах.
          </p>
        </div>

        <div>
          <p className="eyebrow">01 · почему свежесть</p>
          <h2 className="display-2 mt-5 max-w-[22ch]">
            «Свежесть» — это не слово на пачке. Это дата, которую мы пишем от руки.
          </h2>
          <p className="lede mt-6 max-w-[36rem]">
            Кофе — не вино. Он не становится лучше от того, что полежал. У него есть несколько
            недель, когда он звучит ярче всего, — и наша работа сделать так, чтобы вы попали
            в этот промежуток.
          </p>

          <div className="mt-9">
            {points.map((point) => (
              <div
                key={point.number}
                className="grid grid-cols-[auto_1fr] gap-5 border-t border-rule py-6 first:border-t-0 first:pt-0"
              >
                <span className="font-display pt-0.5 text-2xl leading-none text-terracotta">
                  {point.number}
                </span>
                <div>
                  <h3 className="text-[1.2rem] leading-snug">{point.title}</h3>
                  <p className="mt-2 max-w-[36rem] text-[0.95rem] leading-relaxed text-ink-soft">
                    {point.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <figure className="mt-8 border-l-2 border-terracotta pl-5">
            <blockquote className="font-hand text-2xl leading-snug text-ink sm:text-3xl">
              «Если на дегустации зерно «не звучит» — партия не поедет. Можно объяснить что угодно
              словами, но чашку не обманешь.»
            </blockquote>
            <figcaption className="mt-3 text-xs font-semibold tracking-[0.14em] text-ink-mute uppercase">
              Аня, отвечает за обжарку
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
