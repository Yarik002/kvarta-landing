/**
 * ЧЕРНОВИК ИИ, ОТКЛОНЁН НА РЕВЬЮ.
 *
 * Что это: первая версия hero-экрана, которую сгенерировал ассистент
 * по запросу «сделай красивый лендинг для обжарки». Типичный результат
 * «согласились с первым вариантом»: фиолетово-синий градиент, стеклянные
 * карточки, неоновые акценты и текст «инновационная обжарка нового поколения».
 *
 * Почему отклонён:
 *   • бриф прямо запрещает glassmorphism, неоновые градиенты и шаблонные
 *     нейросетевые формулировки;
 *   • ни одного факта о клиенте: партии 5 кг, четверг/пятница, 1–3 день,
 *     Аня и Дмитрий — всё потерялось за «эстетикой»;
 *   • на мобильном с таким hero не остаётся места ни для чего живого.
 *
 * Что сделано вместо: see src/components/hero.tsx — бумажная палитра,
 * журнальная типографика, фото ростера, расписание обжарки и живые подписи.
 */

import Image from "next/image";
import { Sparkles, Zap, ArrowRight } from "lucide-react";

export function HeroDraft() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-700 px-6 pb-24 pt-32 text-white">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-fuchsia-500/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-40 h-80 w-80 rounded-full bg-cyan-400/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Инновационная обжарка нового поколения
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-tight lg:text-6xl">
            Premium coffee <span className="text-cyan-300">experience</span> для тех, кто
            ценит совершенство
          </h1>

          <p className="mt-6 max-w-lg text-lg text-white/80">
            Мы объединяем лучшие зёрна, современные технологии обжарки и любовь к кофе, чтобы
            подарить вам незабываемые эмоции в каждой чашке.
          </p>

          <button className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-purple-900 shadow-2xl shadow-fuchsia-500/40 transition hover:scale-105">
            Начать путешествие
            <ArrowRight className="h-5 w-5" />
          </button>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {["100% premium", "Organic", "AI-подбор"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 text-center text-sm backdrop-blur"
              >
                <Zap className="mx-auto mb-1 h-4 w-4 text-cyan-300" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-400/40 to-fuchsia-500/40 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
            <Image
              src="/placeholder-coffee.jpg"
              alt="Кофе"
              width={900}
              height={700}
              className="rounded-2xl object-cover"
            />
            <div className="absolute bottom-8 left-8 rounded-2xl border border-white/20 bg-black/30 px-5 py-3 backdrop-blur">
              <p className="text-sm text-white/70">Свежая обжарка</p>
              <p className="text-xl font-bold">каждую неделю</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
