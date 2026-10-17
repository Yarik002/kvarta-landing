/**
 * Единый источник правды о клиенте.
 *
 * Все данные ниже — вымышленные для тестового задания (обжарка «Кварта»).
 * Контакты помечены в README как демонстрационные: перед публикацией их
 * нужно заменить на реальные.
 */

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = (rawSiteUrl && rawSiteUrl.length > 0
  ? rawSiteUrl
  : "https://kvarta-minsk.vercel.app"
).replace(/\/+$/, "");

export const site = {
  name: "Кварта",
  legalName: "Обжарка «Кварта»",
  city: "Минск",
  since: 2019,
  tagline: "Обжариваем по четвергам, развозим по пятницам",
  description:
    "Маленькая мастерская на ул. Короля, 9. Обжариваем микропартии по 5 кг, развозим по Минску по пятницам. Зерно у вас на 1–3 день после обжарки.",
  url: SITE_URL,
  address: {
    street: "ул. Короля, 9",
    city: "Минск",
    full: "Минск, ул. Короля, 9",
    note: "вход со двора, вывеска с четвергом",
    mapUrl:
      "https://yandex.by/maps/?text=%D0%9C%D0%B8%D0%BD%D1%81%D0%BA%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%9A%D0%BE%D1%80%D0%BE%D0%BB%D1%8F%2C%209",
  },
  hours: [
    { days: "пн–пт", time: "8:00–20:00" },
    { days: "сб–вс", time: "10:00–18:00" },
  ],
  contacts: {
    phoneDisplay: "+375 (29) 712-34-56",
    phoneHref: "tel:+375297123456",
    telegram: "https://t.me/kvarta_minsk_bot",
    telegramLabel: "@kvarta_minsk_bot",
    instagram: "https://www.instagram.com/kvarta.coffee",
    instagramLabel: "@kvarta.coffee",
    email: "hello@kvarta.by",
  },
  delivery: {
    city: "Минск",
    day: "пятница",
    freeFromByn: 50,
    note: "Доставляем по Минску в пятницу. От 50 BYN — бесплатно, меньше — договоримся о курьере при звонке.",
  },
  roast: {
    batchKg: 5,
    weekday: "четверг",
    deliveryWeekday: "пятница",
    freshnessDays: "1–3",
  },
  nav: [
    { href: "#catalog", label: "Сорта" },
    { href: "#subscription", label: "Подписка" },
    { href: "#delivery", label: "Доставка" },
    { href: "#faq", label: "Вопросы" },
  ],
} as const;

export const siteMeta = {
  title: "Кварта — кофе, который ещё помнит четверг",
  titleTemplate: "%s · Кварта",
  description:
    "Крафтовая обжарка в Минске. Микропартии по 5 кг, обжарка по четвергам, доставка по пятницам. Зерно у вас на 1–3 день после обжарки. Подписка 54 BYN/мес.",
  ogAlt: "Кварта — крафтовая обжарка кофе в Минске",
} as const;
