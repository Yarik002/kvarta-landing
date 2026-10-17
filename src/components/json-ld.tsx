import { products } from "@/lib/catalog";
import type { RoastSchedule } from "@/lib/schedule";
import { SITE_URL, site } from "@/lib/site";

interface JsonLdProps {
  schedule: RoastSchedule;
}

/**
 * Schema.org — для локального поиска и нормального сниппета.
 * Данные статические (вымышленный клиент из брифа), поэтому просто
 * сериализуем объект и экранируем `<`, чтобы JSON нельзя было
 * «прервать» тегом.
 */
export function JsonLd({ schedule }: JsonLdProps) {
  const openingHours = [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "10:00",
      closes: "18:00",
    },
  ];

  const data = {
    "@context": "https://schema.org",
    "@type": "CoffeeShop",
    name: site.legalName,
    description: site.description,
    url: SITE_URL,
    image: `${SITE_URL}/og/kvarta-og.jpg`,
    telephone: site.contacts.phoneHref.replace("tel:", ""),
    priceRange: "18–54 BYN",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressCountry: "BY",
    },
    openingHoursSpecification: openingHours,
    sameAs: [site.contacts.instagram, site.contacts.telegram],
    makesOffer: products.map((product) => ({
      "@type": "Offer",
      priceCurrency: "BYN",
      price: product.priceByn,
      itemOffered: {
        "@type": "Product",
        name: product.name,
        description: product.description,
      },
    })),
    additionalProperty: {
      "@type": "PropertyValue",
      name: "Ближайшая обжарка",
      value: schedule.roastDate.toISOString(),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
