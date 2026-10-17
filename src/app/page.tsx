import { getRoastSchedule } from "@/lib/schedule";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { Manifesto } from "@/components/manifesto";
import { Founders } from "@/components/founders";
import { Catalog } from "@/components/catalog";
import { Subscription } from "@/components/subscription";
import { Delivery } from "@/components/delivery";
import { Faq } from "@/components/faq";
import { LeadSection } from "@/components/lead-section";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// РЎС‚СЂР°РЅРёС†Р° СЃС‚Р°С‚РёС‡РµСЃРєР°СЏ, РЅРѕ СЂР°Р· РІ С‡Р°СЃ РїРµСЂРµСЃРѕР±РёСЂР°РµС‚СЃСЏ: РґР°С‚С‹ РѕР±Р¶Р°СЂРєРё
// Рё В«РґРµРґР»Р°Р№РЅ Р·Р°РєР°Р·РѕРІВ» РЅРµ РґРѕР»Р¶РЅС‹ СѓСЃС‚Р°СЂРµРІР°С‚СЊ.
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
        <LeadSection schedule={schedule} />
      </main>
      <SiteFooter />
    </>
  );
}

