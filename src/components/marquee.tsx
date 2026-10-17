/**
 * Бегущая строка между первым экраном и историей.
 * Две одинаковые группы контента — конец одной незаметно переходит в начало другой.
 */

const items = [
  "обжариваем по четвергам",
  "развозим по пятницам",
  "партии по 5 кг",
  "зерно на 1–3 день после обжарки",
  "ул. Короля, 9",
  "с 2019 года",
];

function MarqueeGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="marquee-group" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <span key={item} className="flex items-center gap-9">
          <span>{item}</span>
          <span className="marquee-dot">✳</span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="marquee" role="presentation" aria-hidden="true">
      <div className="marquee-track">
        <MarqueeGroup />
        <MarqueeGroup hidden />
      </div>
    </div>
  );
}
