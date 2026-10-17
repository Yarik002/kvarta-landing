"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { filters, products, type CatalogFilter, type CoffeeProduct } from "@/lib/catalog";
import { orderLeadPrefill } from "@/lib/lead-events";

function CoffeeCard({ product }: { product: CoffeeProduct }) {
  return (
    <article className="paper-card group flex h-full flex-col p-5 transition-colors duration-200 hover:border-ink sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="stamp">{product.roastLabel}</span>
        <p className="font-display text-[1.6rem] leading-none tracking-tight">
          {product.priceByn}
          <span className="ml-1 font-sans text-[0.6rem] font-semibold tracking-[0.14em] text-ink-mute uppercase">
            byn
          </span>
        </p>
      </div>

      <h3 className="display-3 mt-5">{product.name}</h3>
      <p className="mt-1 text-[0.66rem] font-semibold tracking-[0.14em] text-ink-mute uppercase">
        {product.subtitle} · {product.weight}
      </p>

      <p className="font-hand mt-3 text-xl leading-snug text-terracotta-deep">
        {product.notes.join(" · ")}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{product.description}</p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed border-rule-strong pt-4">
        <span className="text-xs leading-relaxed text-ink-mute">{product.brew}</span>
        <button
          type="button"
          className="btn btn-outline min-h-0 px-3.5 py-2 text-[0.82rem]"
          onClick={() => orderLeadPrefill("order", `Хочу ${product.name}, ${product.weight}.`)}
          aria-label={`Заказать ${product.name}`}
        >
          Заказать
          <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.75} />
        </button>
      </div>
    </article>
  );
}

export function Catalog() {
  const [active, setActive] = useState<CatalogFilter["id"]>("all");
  const visibleProducts = active === "all" ? products : products.filter((product) => product.category === active);

  return (
    <section id="catalog" className="section defer-layout border-b border-rule">
      <div className="wrap">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow">03 · ассортимент</p>
            <h2 className="display-2 mt-5">В этот четверг</h2>
            <p className="lede mt-4 max-w-[42rem]">
              Четыре позиции, которые мы обжарили на этой неделе. Партии маленькие: что-то может
              закончиться раньше пятницы — так и задумано.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline w-fit"
            onClick={() => orderLeadPrefill("question", "Подскажите, что выбрать: пью кофе дома, фильтр, без молока.")}
          >
            Помочь с выбором
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-rule pb-2" role="group" aria-label="Фильтр по обжарке">
          {filters.map((filter) => {
            const count =
              filter.id === "all"
                ? products.length
                : products.filter((product) => product.category === filter.id).length;

            return (
              <button
                key={filter.id}
                type="button"
                className="filter-tab"
                aria-pressed={active === filter.id}
                onClick={() => setActive(filter.id)}
              >
                {filter.label}
                <span className="ml-1.5 text-[0.7rem] font-normal text-ink-mute">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {visibleProducts.map((product) => (
            <CoffeeCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs leading-relaxed text-ink-mute">
          <p className="flex items-start gap-2">
            <Check aria-hidden="true" className="mt-0.5 shrink-0 text-olive" size={14} strokeWidth={2} />
            Цены — за пачку. В зёрнах или молотый — скажите в комментарии: смелем под ваш способ.
          </p>
          <p>Обжарка — четверг. Отправляем в пятницу.</p>
        </div>
      </div>
    </section>
  );
}
