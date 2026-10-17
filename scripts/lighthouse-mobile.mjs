#!/usr/bin/env node
/**
 * Lighthouse Mobile для «Кварты».
 *
 * Поднимает production-сервер (или берёт уже запущенный по --url),
 * запускает headless Edge/Chrome с remote debugging и снимает отчёт
 * в docs/screenshots/ (HTML + JSON + краткая сводка).
 *
 * Использование:
 *   node scripts/lighthouse-mobile.mjs                 # сервер запустится сам
 *   node scripts/lighthouse-mobile.mjs --url=http://127.0.0.1:3100
 *
 * Chrome: ищем Chrome, иначе Edge (Windows). Можно задать CHROME_PATH.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.LIGHTHOUSE_PORT ?? 3100);
const DEBUG_PORT = Number(process.env.LIGHTHOUSE_DEBUG_PORT ?? 9333);
const URL_ARG = process.argv.find((arg) => arg.startsWith("--url="))?.slice("--url=".length);
const TARGET_URL = URL_ARG ?? `http://127.0.0.1:${PORT}`;
const OUT_DIR = join(ROOT, "docs", "screenshots");

mkdirSync(OUT_DIR, { recursive: true });

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
}

async function waitForUrl(url, attempts = 120, delayMs = 1_000) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // ещё не готово
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`${url} не ответил за отведённое время`);
}

function startNextServer() {
  const nextBin = join(ROOT, "node_modules", "next", "dist", "bin", "next");
  return spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: "ignore",
    env: { ...process.env, NODE_ENV: "production" },
  });
}

function startBrowser(chromePath) {
  const userDataDir = mkdtempSync(join(tmpdir(), "kvarta-lighthouse-"));
  const child = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-gpu",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  return child;
}

async function main() {
  let server = null;
  let browser = null;

  try {
    if (!URL_ARG) {
      console.log(`[lighthouse] Запускаю production-сервер на ${TARGET_URL}…`);
      server = startNextServer();
      await waitForUrl(TARGET_URL);
    }

    const chromePath = findChrome();
    if (!chromePath) {
      throw new Error("Не нашёл Chrome/Edge. Установите Chrome или задайте CHROME_PATH.");
    }

    console.log(`[lighthouse] Браузер: ${chromePath}`);
    browser = startBrowser(chromePath);
    await waitForUrl(`http://127.0.0.1:${DEBUG_PORT}/json/version`);

    const lighthouse = (await import("lighthouse")).default;

    const result = await lighthouse(TARGET_URL, {
      port: DEBUG_PORT,
      output: ["html", "json"],
      logLevel: "error",
      formFactor: "mobile",
      screenEmulation: {
        mobile: true,
        width: 412,
        height: 823,
        deviceScaleFactor: 1.75,
        disabled: false,
      },
      throttlingMethod: process.env.LIGHTHOUSE_THROTTLE === "devtools" ? "devtools" : "simulate",
      throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });

    if (!result) {
      throw new Error("Lighthouse не вернул результат");
    }

    const reports = Array.isArray(result.report) ? result.report : [result.report];
    const html = reports.find((report) => String(report).trimStart().startsWith("<!"));
    const json = reports.find((report) => String(report).trimStart().startsWith("{"));

    writeFileSync(join(OUT_DIR, "lighthouse-mobile.html"), String(html ?? ""));
    writeFileSync(join(OUT_DIR, "lighthouse-mobile.json"), String(json ?? ""));

    const scores = {
      performance: Math.round((result.lhr.categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((result.lhr.categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((result.lhr.categories["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((result.lhr.categories.seo?.score ?? 0) * 100),
      lcp: result.lhr.audits["largest-contentful-paint"]?.displayValue ?? "n/a",
      cls: result.lhr.audits["cumulative-layout-shift"]?.displayValue ?? "n/a",
      tbt: result.lhr.audits["total-blocking-time"]?.displayValue ?? "n/a",
      fcp: result.lhr.audits["first-contentful-paint"]?.displayValue ?? "n/a",
      fetchedAt: new Date().toISOString(),
      url: TARGET_URL,
    };

    writeFileSync(
      join(OUT_DIR, "lighthouse-scores.txt"),
      [
        "Lighthouse Mobile · Кварта",
        `URL: ${scores.url}`,
        `Дата: ${new Date(scores.fetchedAt).toLocaleString("ru-RU", { timeZone: "Europe/Minsk" })}`,
        "",
        `Performance:     ${scores.performance}`,
        `Accessibility:   ${scores.accessibility}`,
        `Best Practices:  ${scores.bestPractices}`,
        `SEO:             ${scores.seo}`,
        "",
        `FCP: ${scores.fcp}`,
        `LCP: ${scores.lcp}`,
        `TBT: ${scores.tbt}`,
        `CLS: ${scores.cls}`,
        "",
      ].join("\n"),
    );

    console.log("\n[lighthouse] Итоги (mobile):");
    console.log(`  performance      ${scores.performance}`);
    console.log(`  accessibility    ${scores.accessibility}`);
    console.log(`  best-practices   ${scores.bestPractices}`);
    console.log(`  seo              ${scores.seo}`);
    console.log(`  LCP ${scores.lcp} · TBT ${scores.tbt} · CLS ${scores.cls}`);
    console.log(`\n[lighthouse] Отчёт: ${join(OUT_DIR, "lighthouse-mobile.html")}`);
  } finally {
    browser?.kill();
    server?.kill();
  }
}

main().catch((error) => {
  console.error("[lighthouse] Ошибка:", error);
  process.exitCode = 1;
});
