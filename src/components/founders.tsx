import Image from "next/image";
import handsPhoto from "@/assets/photos/story-hands.webp";

const timeline = [
  { year: "2019", text: "Первый ростер на 5 кг и гараж на Короля, 9." },
  { year: "2021", text: "Пятничная развозка становится привычкой, а не экспериментом." },
  { year: "2024", text: "Запускаем подписку: две пачки в месяц, без уговоров и «условий»." },
];

export function Founders() {
  return (
    <section id="story" className="section defer-layout">
      <div className="wrap grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <div>
          <p className="eyebrow">02 · кто мы</p>
          <h2 className="display-2 mt-5 max-w-[24ch]">
            Начинали за стойкой — теперь обжариваем сами.
          </h2>

          <div className="mt-6 max-w-[38rem] space-y-4 text-[1.02rem] leading-relaxed text-ink-soft">
            <p>
              Мы — Аня и Дмитрий. Познакомились за барной стойкой: она настраивала помол, он
              разбирался, почему утренняя смена начинается не с улыбки, а с погасшей кофемашины.
              В 2019-м оба ушли из кофеен: хотелось отвечать за весь путь — от зелёного зерна до
              чашки.
            </p>
            <p>
              Купили ростер на 5 кг, сняли помещение на улице Короля и начали обжаривать по
              четвергам. Первые полгода пили свои ошибки сами — так и научились различать, когда
              зерно «зелёное», когда пережарено и когда просто нужно ещё два дня отдыха.
            </p>
            <p>
              Сейчас у нас тот же ростер, тот же четверг и та же привычка: небольшая партия, ручная
              запись даты на пачке, в пятницу — развозка по Минску. Только гостей стало больше, и
              теперь под наш кофе иногда приезжают из другого города.
            </p>
          </div>

          <p className="font-hand mt-6 text-3xl text-terracotta-deep">— Аня и Дмитрий</p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-6 text-sm sm:grid-cols-4">
            {[
              { term: "с", value: "2019" },
              { term: "партия", value: "5 кг" },
              { term: "нас", value: "двое" },
              { term: "ростер", value: "один" },
            ].map((fact) => (
              <div key={fact.term}>
                <dt className="text-[0.62rem] font-semibold tracking-[0.18em] text-ink-mute uppercase">
                  {fact.term}
                </dt>
                <dd className="mt-1 font-display text-lg">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-6">
          <div className="photo-frame aspect-[4/3]">
            <Image
              src={handsPhoto}
              alt="Две пары рук держат чашки кофе над деревянным столом — Аня и Дмитрий после смены"
              fill
              sizes="(min-width: 1024px) 38vw, 92vw"
              className="object-cover"
              placeholder="blur"
            />
          </div>

          <ol className="space-y-3">
            {timeline.map((item) => (
              <li key={item.year} className="grid grid-cols-[auto_1fr] gap-4 border-t border-rule pt-3">
                <span className="font-display text-lg leading-none text-terracotta">{item.year}</span>
                <span className="text-sm leading-relaxed text-ink-soft">{item.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
