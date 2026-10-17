import { ArrowUpRight } from "lucide-react";
import { site } from "@/lib/site";

const year = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="defer-layout border-t border-rule bg-paper">
      <div className="wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.65fr_0.75fr_0.85fr]">
        <div>
          <p className="font-display text-[2.2rem] leading-none tracking-[-0.035em]">кварта</p>
          <p className="mt-3 max-w-[21rem] text-sm leading-relaxed text-ink-soft">
            Маленькая обжарка в Минске. Микропартии 5 кг: в четверг обжариваем, в пятницу развозим.
          </p>
          <p className="font-hand mt-4 text-2xl text-terracotta-deep">приходите с чашкой</p>
        </div>

        <nav aria-label="Навигация в подвале">
          <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-ink-mute uppercase">сайт</p>
          <ul className="mt-3 space-y-2 text-sm">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="link-underline inline-block py-0.5 text-ink-soft hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#lead" className="link-underline inline-block py-0.5 text-ink-soft hover:text-ink">
                Заявка
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-ink-mute uppercase">контакты</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={site.contacts.phoneHref} className="link-underline font-semibold">
                {site.contacts.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={site.contacts.telegram}
                target="_blank"
                rel="noreferrer"
                className="link-underline inline-flex items-center gap-1"
              >
                Telegram {site.contacts.telegramLabel}
                <ArrowUpRight aria-hidden="true" size={13} strokeWidth={1.75} />
              </a>
            </li>
            <li>
              <a
                href={site.contacts.instagram}
                target="_blank"
                rel="noreferrer"
                className="link-underline inline-flex items-center gap-1"
              >
                Instagram {site.contacts.instagramLabel}
                <ArrowUpRight aria-hidden="true" size={13} strokeWidth={1.75} />
              </a>
            </li>
            <li>
              <a href={`mailto:${site.contacts.email}`} className="link-underline">
                {site.contacts.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-ink-mute uppercase">
            мастерская
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>{site.address.full}</li>
            <li>{site.address.note}</li>
            <li className="pt-1">
              {site.hours.map((row) => (
                <span key={row.days} className="block">
                  {row.days} · {row.time}
                </span>
              ))}
            </li>
            <li className="pt-1">
              <a
                href={site.address.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="link-underline inline-flex items-center gap-1"
              >
                На карте
                <ArrowUpRight aria-hidden="true" size={13} strokeWidth={1.75} />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="wrap flex flex-col gap-2 py-5 text-[0.72rem] leading-relaxed text-ink-mute sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Обжарка «Кварта» · Минск, {site.address.street}
          </p>
          <p>Фото — Unsplash. Сделано с уважением к свежести.</p>
        </div>
      </div>
    </footer>
  );
}
