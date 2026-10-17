import { ArrowUpRight, Plus } from "lucide-react";
import { site } from "@/lib/site";

const items = [
  {
    question: "Чем ваш кофе отличается от магазинного?",
    answer:
      "Дата обжарки. На каждой пачке — день, когда мы обжарили партию. В магазине кофе часто проводит на складе месяцы, а мы отдаём зерно на 1–3 день и стараемся, чтобы оно уехало к вам сразу.",
  },
  {
    question: "В зёрнах или молоть?",
    answer:
      "В зёрнах вкуснее и живёт дольше. Но если кофемолки нет — смелем под ваш способ: «в воронку», «в рожок» или «в турку». Просто скажите в комментарии к заявке.",
  },
  {
    question: "Как хранить кофе дома?",
    answer:
      "В закрытой пачке, в тёмном месте, при комнатной температуре. Не держите открытую пачку в холодильнике: конденсат и посторонние запахи испортят зерно быстрее, чем воздух.",
  },
  {
    question: "Не люблю кислотность — что взять?",
    answer:
      "Берите Бразилию Серрадо: орех, шоколад и мягкая горечь без резких ягодных нот. Если сомневаетесь — выберите в форме «Вопрос», напишите, как обычно пьёте кофе, и мы подберём.",
  },
  {
    question: "Как оплатить заказ?",
    answer:
      "Картой или наличными при получении, либо переводом по счёту. Менеджер перезвонит и скажет, как удобнее — никакой оплаты на сайте не нужно.",
  },
  {
    question: "Что если заказ не понравится?",
    answer:
      "Напишите нам. Если дело во вкусе — предложим другой сорт или помол, если в логистике — переделаем доставку. Разбираемся без споров и «условий возврата»: репутация дороже одной пачки.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="section defer-layout border-b border-rule">
      <div className="wrap grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div className="self-start lg:sticky lg:top-32">
          <p className="eyebrow">06 · вопросы</p>
          <h2 className="display-2 mt-5 max-w-[14ch]">Спрашивают чаще всего</h2>
          <p className="mt-4 max-w-[26rem] text-sm leading-relaxed text-ink-soft">
            Не нашли ответ? Напишите в Telegram — отвечаем быстрее, чем варится эспрессо.
          </p>
          <a
            href={site.contacts.telegram}
            target="_blank"
            rel="noreferrer"
            className="link-underline mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            {site.contacts.telegramLabel}
            <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.75} />
          </a>
        </div>

        <div className="border-t border-rule">
          {items.map((item) => (
            <details key={item.question} className="faq-item border-b border-rule">
              <summary>
                <h3 className="text-[1.05rem] leading-snug font-normal">{item.question}</h3>
                <Plus aria-hidden="true" className="text-terracotta" size={18} strokeWidth={1.75} />
              </summary>
              <p className="max-w-[40rem] pb-5 text-sm leading-relaxed text-ink-soft">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
