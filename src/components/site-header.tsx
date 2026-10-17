"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { site } from "@/lib/site";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper">
      <div className="hidden border-b border-rule/70 bg-paper-deep/45 md:block">
        <div className="wrap flex items-center justify-between gap-4 py-1.5 text-[0.66rem] font-semibold tracking-[0.16em] text-ink-soft uppercase">
          <p>Микропартии 5 кг · обжарка по четвергам · развозка по пятницам</p>
          <p className="flex items-center gap-5">
            <a className="link-underline" href={site.contacts.phoneHref}>
              {site.contacts.phoneDisplay}
            </a>
            <a
              className="link-underline"
              href={site.contacts.telegram}
              target="_blank"
              rel="noreferrer"
            >
              Telegram
            </a>
          </p>
        </div>
      </div>

      <div className="wrap flex h-16 items-center justify-between gap-4 md:h-[4.75rem]">
        <a href="#top" className="group flex items-baseline gap-2.5" aria-label="Кварта — на главную">
          <span className="font-display text-[1.7rem] leading-none tracking-[-0.035em]">кварта</span>
          <span className="hidden text-[0.6rem] font-semibold tracking-[0.18em] text-ink-mute uppercase sm:block">
            обжарка · Минск
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Основная навигация">
          {site.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="link-underline text-sm font-medium text-ink-soft hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={site.contacts.phoneHref}
            className="hidden text-sm font-semibold text-ink-soft hover:text-terracotta-deep lg:block"
          >
            {site.contacts.phoneDisplay}
          </a>
          <a href="#lead" className="btn btn-primary hidden sm:inline-flex">
            Оставить заявку
          </a>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[3px] border border-rule-strong text-ink md:hidden"
            aria-label="Открыть меню"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu aria-hidden="true" size={20} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-50 flex flex-col bg-paper md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
        >
          <div className="wrap flex h-16 items-center justify-between border-b border-rule">
            <span className="font-display text-[1.7rem] leading-none tracking-[-0.035em]">кварта</span>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[3px] border border-rule-strong text-ink"
              aria-label="Закрыть меню"
              onClick={() => setMenuOpen(false)}
            >
              <X aria-hidden="true" size={20} strokeWidth={1.75} />
            </button>
          </div>

          <nav className="wrap flex flex-1 flex-col justify-center gap-1" aria-label="Мобильная навигация">
            {site.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="border-b border-rule py-4 font-display text-3xl tracking-[-0.02em]"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#lead"
              className="btn btn-primary mt-6 w-full"
              onClick={() => setMenuOpen(false)}
            >
              Оставить заявку
            </a>
          </nav>

          <div className="wrap border-t border-rule py-6 text-sm text-ink-soft">
            <p className="font-semibold text-ink">{site.contacts.phoneDisplay}</p>
            <p className="mt-1">
              {site.address.city}, {site.address.street} · пн–пт 8:00–20:00
            </p>
            <a
              href={site.contacts.telegram}
              className="link-underline mt-2 inline-block"
              target="_blank"
              rel="noreferrer"
            >
              {site.contacts.telegramLabel}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
