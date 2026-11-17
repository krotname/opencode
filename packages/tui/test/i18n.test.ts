import { expect, test } from "bun:test"
import { createI18n, i18n } from "../src/i18n"
import type { Dictionary } from "../src/i18n"
import { dict } from "../src/i18n/en"
import type { Key } from "../src/i18n/en"

const russian = {
  "sidebar.context.tokens.one": "{count} токен",
  "sidebar.context.tokens.few": "{count} токена",
  "sidebar.context.tokens.many": "{count} токенов",
  "sidebar.context.tokens.other": "{count} токена",
} satisfies Partial<Dictionary>

test("the alert catalog preserves the existing English display text", () => {
  expect(i18n.t("dialog.group")).toBe("Dialog")
  expect(i18n.t("dialog.alert.confirm")).toBe("Confirm alert")
  expect(i18n.t("dialog.alert.ok")).toBe("ok")
})

test("an incomplete catalog falls back to English per key", () => {
  const language = createI18n(() => ({ "dialog.alert.ok": "OK" }))
  expect(language.t("dialog.alert.ok")).toBe("OK")
  expect(language.t("dialog.alert.confirm")).toBe("Confirm alert")
})

test("translation reads the current source instead of retaining the initial catalog", () => {
  const source: { dict: Partial<Dictionary> } = { dict: {} }
  const language = createI18n(() => source.dict)
  expect(language.t("dialog.alert.ok")).toBe("ok")
  source.dict = { "dialog.alert.ok": "OK" }
  expect(language.t("dialog.alert.ok")).toBe("OK")
  source.dict = {}
  expect(language.t("dialog.alert.ok")).toBe("ok")
})

test("independent catalogs do not change the default English source", () => {
  const language = createI18n(() => ({ "dialog.alert.ok": "OK" }))
  expect(language.t("dialog.alert.ok")).toBe("OK")
  expect(i18n.t("dialog.alert.ok")).toBe("ok")
})

test("an explicitly empty translation is preserved", () => {
  expect(createI18n(() => ({ "dialog.alert.ok": "" })).t("dialog.alert.ok")).toBe("")
})

test("sidebar context uses complete English messages and singular tokens", () => {
  expect(i18n.t("sidebar.context.title")).toBe("Context")
  expect(i18n.plural("sidebar.context.tokens", 12345)).toBe("12,345 tokens")
  expect(i18n.plural("sidebar.context.tokens", 1)).toBe("1 token")
  expect(i18n.t("sidebar.context.used", { percent: 0 })).toBe("0% used")
  expect(i18n.t("sidebar.context.spent", { amount: "$1.23" })).toBe("$1.23 spent")
})

test("a translated message can move and repeat a named parameter", () => {
  const language = createI18n(() => ({ "sidebar.context.tokens.other": "Tokens: {count} ({count})" }))
  expect(language.plural("sidebar.context.tokens", 42)).toBe("Tokens: 42 (42)")
  expect(language.t("sidebar.context.used", { percent: 75 })).toBe("75% used")
})

test("parameter values stay literal instead of becoming replacement patterns or placeholders", () => {
  const language = createI18n(() => ({ "sidebar.context.spent": "{amount} / {amount}" }))
  expect(language.t("sidebar.context.spent", { amount: "$& {amount}" })).toBe("$& {amount} / $& {amount}")
})

test("unknown placeholders do not read inherited properties", () => {
  const language = createI18n(() => ({ "sidebar.context.tokens.other": "{count} {toString} {missing}" }))
  expect(language.plural("sidebar.context.tokens", 0)).toBe("0 {toString} {missing}")
})

test.each([
  [0, "0 токенов"],
  [1, "1 токен"],
  [2, "2 токена"],
  [5, "5 токенов"],
  [11, "11 токенов"],
  [21, "21 токен"],
  [22, "22 токена"],
  [25, "25 токенов"],
  [1.5, "1,5 токена"],
])("Russian token count %s", (count, expected) => {
  const language = createI18n(
    () => russian,
    () => "ru-RU",
  )
  expect(language.plural("sidebar.context.tokens", count)).toBe(expected)
})

test("plural fallback uses the English category when Russian forms are missing", () => {
  const language = createI18n(
    () => ({}),
    () => "ru-RU",
  )
  expect(language.plural("sidebar.context.tokens", 21)).toBe("21 tokens")
  expect(language.plural("sidebar.context.tokens", 1)).toBe("1 token")
})

test("a partial Russian catalog without other falls back to English for fractional counts", () => {
  const language = createI18n(
    () => ({
      "sidebar.context.tokens.one": russian["sidebar.context.tokens.one"],
      "sidebar.context.tokens.few": russian["sidebar.context.tokens.few"],
      "sidebar.context.tokens.many": russian["sidebar.context.tokens.many"],
    }),
    () => "ru-RU",
  )
  expect(language.plural("sidebar.context.tokens", 2)).toBe("2 токена")
  expect(language.plural("sidebar.context.tokens", 1.5)).toBe("1,5 tokens")
})

test("translated fixture entries preserve English placeholders without requiring full coverage", () => {
  const placeholders = (text: string) =>
    [...new Set(Array.from(text.matchAll(/\{(\w+)\}/g), (match) => match[1]))].sort()
  Object.entries(russian).forEach(([key, value]) => {
    const base = key.slice(0, key.lastIndexOf("."))
    const english = dict[key as Key] ?? dict[`${base}.other` as Key]
    expect(placeholders(value)).toEqual(placeholders(english))
  })
})

test("number and currency formatting follow the current catalog locale", () => {
  const state = { locale: "en-US" }
  const language = createI18n(
    () => ({}),
    () => state.locale,
  )
  expect(language.format.number(12345.5)).toBe("12,345.5")
  expect(language.format.currency(1.23, "USD")).toBe("$1.23")
  state.locale = "ru-RU"
  expect(language.format.number(12345.5)).toBe("12\u00a0345,5")
  expect(language.format.currency(1.23, "USD")).toBe("1,23\u00a0$")
  expect(language.format.currency(1.23, "EUR")).toBe("1,23\u00a0€")
  expect(language.format.currency(1.23, "USD")).toBe("1,23\u00a0$")
  state.locale = "en-US"
  expect(language.format.number(12345.5)).toBe("12,345.5")
  expect(language.format.currency(1.23, "EUR")).toBe("€1.23")
  expect(language.format.currency(1.23, "USD")).toBe("$1.23")
})
