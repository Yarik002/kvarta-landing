import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display-2 mt-5 max-w-[18ch]">Эту чашку уже забрали</h1>
      <p className="lede mt-4 max-w-[30rem]">
        Страницы по такой ссылке нет. Но кофе, который ещё помнит четверг, — есть.
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        Вернуться на главную
      </Link>
    </main>
  );
}
