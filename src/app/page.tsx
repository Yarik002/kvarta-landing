import { getRoastSchedule } from "@/lib/schedule";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { Manifesto } from "@/components/manifesto";
import { Founders } from "@/components/founders";
import { Catalog } from "@/components/catalog";
import { Subscription } from "@/components/subscription";
import { Delivery } from "@/components/delivery";
import { Faq } from "@/components/faq";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Страница статическая, но раз в час пересобирается: даты обжарки
// и «дедлайн заказов» не должны устаревать.
export const revalidate = 3600;

export default function HomePage() {
  const schedule = getRoastSchedule();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero schedule={schedule} />
        <Marquee />
        <Manifesto />
        <Founders />
        <Catalog />
        <Subscription schedule={schedule} />
        <Delivery schedule={schedule} />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
