/**
 * Ассортимент обжарки. Данные — из брифа тестового задания,
 * тексты переписаны своими словами.
 */

export type RoastCategory = "light" | "medium" | "espresso" | "drip";

export interface CoffeeProduct {
  /** Стабильный id для фильтра и пресетов формы. */
  id: string;
  name: string;
  subtitle: string;
  category: RoastCategory;
  roastLabel: string;
  notes: string[];
  weight: string;
  priceByn: number;
  description: string;
  brew: string;
}

export interface CatalogFilter {
  id: "all" | RoastCategory;
  label: string;
}

export const filters: CatalogFilter[] = [
  { id: "all", label: "Всё" },
  { id: "light", label: "Светлая" },
  { id: "medium", label: "Средняя" },
  { id: "espresso", label: "Эспрессо" },
  { id: "drip", label: "Дрипы" },
];

export const products: CoffeeProduct[] = [
  {
    id: "ethiopia-irgacheffe",
    name: "Эфиопия Иргачеффе",
    subtitle: "Эфиопия · мытая обработка",
    category: "light",
    roastLabel: "светлая обжарка",
    notes: ["цветочный", "бергамот", "белый персик"],
    weight: "250 г",
    priceByn: 32,
    description:
      "Самый цветочный лот в этом сезоне. Варим его в фильтре и стараемся ничего не усложнять: горячая вода, воронка и две минуты тишины.",
    brew: "фильтр, аэропресс",
  },
  {
    id: "colombia-huila",
    name: "Колумбия Уила",
    subtitle: "Колумбия · Уила",
    category: "medium",
    roastLabel: "средняя обжарка",
    notes: ["карамель", "красное яблоко"],
    weight: "250 г",
    priceByn: 29,
    description:
      "Универсальный вариант на каждый день: хорошо и в фильтре, и в эспрессо. Красное яблоко и карамель — без резкой кислотности.",
    brew: "фильтр, эспрессо",
  },
  {
    id: "brazil-cerrado",
    name: "Бразилия Серрадо",
    subtitle: "Бразилия · Серрадо",
    category: "espresso",
    roastLabel: "под эспрессо",
    notes: ["орех", "шоколад"],
    weight: "250 г",
    priceByn: 26,
    description:
      "Для рожка и турки: орех, шоколад и мягкая горечь в послевкусии. Если любите пить с молоком — берите этот, не прогадаете.",
    brew: "эспрессо, молоко",
  },
  {
    id: "drip-assorti",
    name: "Дрип-пакеты, ассорти",
    subtitle: "для офиса, поезда и дачи",
    category: "drip",
    roastLabel: "ассорти",
    notes: ["5 Эфиопия + 5 Колумбия"],
    weight: "10 шт.",
    priceByn: 18,
    description:
      "Пять дрипов Эфиопии и пять Колумбии в одной коробке. Не нужны весы, воронка и хорошее настроение: просто залейте кипятком.",
    brew: "просто кипяток",
  },
];

export const subscription = {
  priceByn: 54,
  unit: "BYN / мес",
  packs: 2,
  weight: "250 г",
  features: [
    "Две пачки по 250 г раз в месяц — выбираете сорта сами или доверяете нам",
    "Доставка по Минску бесплатно, всегда в пятницу после обжарки",
    "Напоминаем за пару дней до отправки — можно поменять сорта или пропустить месяц",
    "Пауза и отмена в любой момент, без звонков в поддержку и «условий»",
  ],
  steps: [
    {
      title: "Оставляете заявку",
      text: "Пишете «подписка» в форме. Менеджер перезванивает с 10 до 20 в будни.",
    },
    {
      title: "Выбираем сорта",
      text: "Спрашиваем, что любите: фильтр, эспрессо, с молоком или без. Можно доверить нам.",
    },
    {
      title: "Привозим в пятницу",
      text: "Свежая обжарка приезжает в первую пятницу месяца. Дальше — по кругу.",
    },
  ],
} as const;

export function getProductById(id: string): CoffeeProduct | undefined {
  return products.find((product) => product.id === id);
}

export function filterProducts(category: CatalogFilter["id"]): CoffeeProduct[] {
  if (category === "all") {
    return products;
  }
  return products.filter((product) => product.category === category);
}
