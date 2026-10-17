/**
 * ЧЕРНОВИК ИИ, ОТКЛОНЁН НА РЕВЬЮ.
 *
 * Что это: первый вариант хранения заявок — SQLite-файл рядом с приложением.
 * Выглядит соблазнительно: минимум кода, работает локально, «настоящая БД».
 *
 * Почему отклонён (главная ловушка Vercel Serverless):
 *   • файловая система в serverless-функциях read-only и ephemeral —
 *     запись в ./data/leads.sqlite упадёт с EROFS/EACCES на проде;
 *   • даже если бы запись прошла, каждый холодный старт/инстанс получил бы
 *     свою пустую базу;
 *   • дедупликация по номеру перестала бы работать между инстансами.
 *
 * Что сделано вместо: Telegram Bot API как надёжная доставка + история заявок
 * в переписке, in-memory кольцо последних заявок для отладки, локальный
 * JSONL-файл только вне Vercel и опциональный Upstash Redis (SET NX EX)
 * для атомарной дедупликации на 10 минут. См. src/lib/leads-store.ts,
 * src/lib/telegram.ts и README.
 */

import Database from "better-sqlite3";
import path from "node:path";

const db = new Database(path.join(process.cwd(), "data", "leads.sqlite"));

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    interest TEXT NOT NULL,
    comment TEXT,
    utm_source TEXT,
    created_at TEXT NOT NULL
  );
`);

export function saveLeadDraft(lead: {
  name: string;
  phone: string;
  interest: string;
  comment: string;
  utmSource?: string;
}) {
  const insert = db.prepare(
    `INSERT INTO leads (name, phone, interest, comment, utm_source, created_at)
     VALUES (@name, @phone, @interest, @comment, @utmSource, datetime('now'))`,
  );

  return insert.run({
    ...lead,
    utmSource: lead.utmSource ?? null,
  });
}
