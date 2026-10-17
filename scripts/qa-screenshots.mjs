#!/usr/bin/env node
/**
 * QA + скриншоты «Кварты» через Playwright (использует установленный Edge/Chrome,
 * поэтому не качает браузеры).
 *
 * Что проверяет:
 *   • десктоп и мобильный вид, горизонтальный оверфлоу;
 *   • маску телефона (ввод «291234567» → «+375 (29) 123-45-67»);
 *   • перехват UTM в теле запроса /api/lead;
 *   • успешную отправку и защиту от дубля (повторный сабмит);
 *   • клиентскую валидацию неверного номера;
 *   • экран ошибки при недоступном API;
 *   • пресет формы из каталога (кнопка «Заказать»).
 *
 * Запуск: node scripts/qa-screenshots.mjs [--url=http://127.0.0.1:3100]
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, "docs", "screenshots");
const BASE_URL = process.argv.find((arg) => arg.startsWith("--url="))?.slice("--url=".length) ?? "http://127.0.0.1:3100";
const LANDING_URL = `${BASE_URL}/?utm_source=instagram&utm_medium=cpc&utm_campaign=october_test&utm_content=story_v2&yclid=987654321`;

mkdirSync(OUT_DIR, { recursive: true });

const report = [];
const failures = [];

function check(name, condition, details = "") {
  const ok = Boolean(condition);
  report.push(`${ok ? "PASS" : "FAIL"} · ${name}${details ? ` — ${details}` : ""}`);
  if (!ok) {
    failures.push(name);
  }
  return ok;
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

const PHONE_GOOD = "+375 (44) 987-65-43";
const PHONE_DUPLICATE = "+375 (44) 987-65-43";
const PHONE_BAD = "12345";

async function fillForm(page, { name, phone, comment }) {
  await page.fill("#lead-name", name);
  await page.fill("#lead-phone", "");
  await page.locator("#lead-phone").pressSequentially(phone, { delay: 15 });
  if (comment) {
    await page.fill("#lead-comment", comment);
  }
}

async function revealDeferredSections(page) {
  // content-visibility: auto экономит layout при загрузке, но для полного
  // скриншота секции нужно принудительно отрисовать.
  await page.addStyleTag({
    content: ".defer-layout { content-visibility: visible !important; contain-intrinsic-size: auto !important; }",
  });
  await page.waitForTimeout(300);
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    throw new Error("Не нашёл Chrome/Edge для Playwright.");
  }

  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const consoleErrors = [];

  try {
    // ── 1. Десктоп ──────────────────────────────────────────────────────────
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      locale: "ru-RU",
      timezoneId: "Europe/Minsk",
      reducedMotion: "reduce",
    });
    const desktopPage = await desktop.newPage();
    desktopPage.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await desktopPage.goto(LANDING_URL, { waitUntil: "networkidle" });
    await revealDeferredSections(desktopPage);
    await desktopPage.screenshot({ path: join(OUT_DIR, "desktop-hero.png") });
    await desktopPage.screenshot({ path: join(OUT_DIR, "desktop-full.png"), fullPage: true });
    check("Десктоп: страница отрисовалась", (await desktopPage.title()).includes("Кварта"));
    const desktopOverflow = await desktopPage.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    check("Десктоп: нет горизонтального оверфлоу", desktopOverflow <= 0, `overflow=${desktopOverflow}px`);
    await desktop.close();

    // ── 2. Мобильный ────────────────────────────────────────────────────────
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: "ru-RU",
      timezoneId: "Europe/Minsk",
      reducedMotion: "reduce",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const page = await mobile.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.goto(LANDING_URL, { waitUntil: "networkidle" });

    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    check("Мобильный: нет горизонтального оверфлоу", mobileOverflow <= 0, `overflow=${mobileOverflow}px`);

    const headingBox = await page.locator("h1").boundingBox();
    check(
      "Мобильный: заголовок не выходит за экран",
      headingBox !== null && headingBox.x >= 0 && headingBox.x + headingBox.width <= 390,
      headingBox ? `right=${Math.round(headingBox.x + headingBox.width)}px` : "нет h1",
    );

    // бургер меню
    const burger = page.getByRole("button", { name: "Открыть меню" });
    check("Мобильный: кнопка меню видна", await burger.isVisible());
    await page.screenshot({ path: join(OUT_DIR, "mobile-hero.png") });
    await revealDeferredSections(page);
    await page.screenshot({ path: join(OUT_DIR, "mobile-full.png"), fullPage: true });

    await burger.click();
    await page.waitForTimeout(200);
    check(
      "Мобильный: меню открывается",
      await page.getByRole("dialog", { name: "Меню" }).isVisible(),
    );
    await page.screenshot({ path: join(OUT_DIR, "mobile-menu.png") });
    await page.getByRole("button", { name: "Закрыть меню" }).click();
    await page.waitForTimeout(200);

    // ── 3. Каталог → пресет формы ───────────────────────────────────────────
    await page.getByRole("button", { name: "Заказать Эфиопия Иргачеффе" }).click();
    await page.waitForTimeout(800);
    const orderTabPressed = await page
      .getByRole("button", { name: "Заказ зерна" })
      .getAttribute("aria-pressed");
    check("Каталог: кнопка «Заказать» выбирает «Заказ зерна»", orderTabPressed === "true");
    const commentValue = await page.inputValue("#lead-comment");
    check(
      "Каталог: сорт попадает в комментарий",
      commentValue.includes("Эфиопия Иргачеффе"),
      commentValue,
    );

    // ── 4. Маска и валидация телефона ───────────────────────────────────────
    await page.fill("#lead-phone", "");
    await page.locator("#lead-phone").pressSequentially("291234567", { delay: 20 });
    const masked = await page.inputValue("#lead-phone");
    check("Маска: 291234567 → +375 (29) 123-45-67", masked === "+375 (29) 123-45-67", masked);

    await page.fill("#lead-name", "Ярослав");
    await page.fill("#lead-comment", "Проверка клиентской валидации");
    await page.locator("#lead-phone").fill("12345");
    await page.getByRole("button", { name: /Отправить заявку/ }).click();
    await page.waitForTimeout(300);
    const phoneErrorVisible = await page.locator("#lead-phone-error").isVisible();
    check("Валидация: неверный номер не отправляется", phoneErrorVisible);

    // ── 5. Успешная отправка + перехват UTM ─────────────────────────────────
    const requestBodies = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/lead") && request.method() === "POST") {
        requestBodies.push(request.postDataJSON());
      }
    });

    await fillForm(page, {
      name: "Ярослав",
      phone: "449876543",
      comment: "Проверка из Playwright: помол под воронку",
    });
    const [leadResponse] = await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes("/api/lead") && response.request().method() === "POST",
      ),
      page.getByRole("button", { name: /Отправить заявку/ }).click(),
    ]);
    const leadJson = await leadResponse.json();
    check("API: заявка принята", leadResponse.status() === 200 && leadJson.ok === true, JSON.stringify(leadJson).slice(0, 160));

    await page.waitForTimeout(400);
    const successVisible = await page.getByText("Спасибо! Заявка у нас.").isVisible();
    check("UI: экран успеха показан", successVisible);
    await page.getByText("Спасибо! Заявка у нас.").scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(OUT_DIR, "form-success.png"), fullPage: false });

    const body = requestBodies.at(-1) ?? {};
    check("UTM: utm_source в теле запроса", body?.attribution?.utm?.utm_source === "instagram", JSON.stringify(body?.attribution?.utm));
    check("UTM: utm_campaign в теле запроса", body?.attribution?.utm?.utm_campaign === "october_test");
    check("UTM: yclid в теле запроса", body?.attribution?.clickId === "987654321");
    check("UTM: страница отправлена", String(body?.attribution?.page ?? "").includes("127.0.0.1:3100") || String(body?.attribution?.page ?? "").includes("localhost"));
    check("Маска: в API уходит нормализованный телефон", body?.phone === "+375449876543", String(body?.phone));
    check("API: requestId передан", typeof body?.requestId === "string" && body.requestId.length > 8);

    // ── 6. Повторная отправка → дедупликация ────────────────────────────────
    await page.getByRole("button", { name: "Отправить ещё одну" }).click();
    await fillForm(page, { name: "Ярослав", phone: "449876543", comment: "Повторная отправка (дубль)" });
    const [duplicateResponse] = await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes("/api/lead") && response.request().method() === "POST",
      ),
      page.getByRole("button", { name: /Отправить заявку/ }).click(),
    ]);
    const duplicateJson = await duplicateResponse.json();
    check(
      "API: повтор с того же номера не создаёт новую заявку",
      duplicateJson.ok === true && duplicateJson.duplicate === true,
      JSON.stringify(duplicateJson).slice(0, 160),
    );
    await page.waitForTimeout(300);
    const duplicateText = await page.getByText("Заявка уже у нас").isVisible();
    check("UI: показан экран «Заявка уже у нас»", duplicateText);

    // ── 7. Ошибка сети/API ──────────────────────────────────────────────────
    await page.getByRole("button", { name: "Отправить ещё одну" }).click();
    await fillForm(page, { name: "Ярослав", phone: "442223344", comment: "Проверка ошибки" });
    await page.route("**/api/lead", (route) => route.abort("failed"));
    await page.getByRole("button", { name: /Отправить заявку/ }).click();
    await page.waitForTimeout(600);
    const errorAlert = page.getByRole("alert");
    check("UI: ошибка отправки видна", await errorAlert.first().isVisible());
    const errorText = await errorAlert.first().innerText();
    check("UI: в ошибке есть телефон и Telegram", errorText.includes("+375") && errorText.includes("Telegram"));
    await page.screenshot({ path: join(OUT_DIR, "form-error.png"), fullPage: false });
    await page.unroute("**/api/lead");

    // Abort запроса — ожидаемая сетевая ошибка, не считаем её ошибкой консоли.
    const unexpectedConsoleErrors = consoleErrors.filter(
      (text) => !/ERR_FAILED|api\/lead|Failed to load resource/i.test(text),
    );
    check("Консоль: без ошибок", unexpectedConsoleErrors.length === 0, unexpectedConsoleErrors.slice(0, 3).join(" | "));

    await mobile.close();

    const summary = [
      "QA-прогон «Кварта» (Playwright + Edge)",
      `URL: ${LANDING_URL}`,
      `Дата: ${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Minsk" })}`,
      "",
      ...report,
      "",
      failures.length === 0 ? "ИТОГ: все проверки пройдены." : `ИТОГ: провалов — ${failures.length}: ${failures.join(", ")}`,
      "",
    ].join("\n");

    writeFileSync(join(OUT_DIR, "qa-report.txt"), summary);
    console.log(summary);

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[qa] Ошибка:", error);
  process.exitCode = 1;
});
