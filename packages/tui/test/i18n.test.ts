import { expect, test } from "bun:test"
import { createI18n, i18n } from "../src/i18n"
import type { Dictionary } from "../src/i18n"

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

test("sidebar context uses complete messages without changing the English display", () => {
  expect(i18n.t("sidebar.context.title")).toBe("Context")
  expect(i18n.t("sidebar.context.tokens", { count: "12,345" })).toBe("12,345 tokens")
  expect(i18n.t("sidebar.context.used", { percent: 0 })).toBe("0% used")
  expect(i18n.t("sidebar.context.spent", { amount: "$1.23" })).toBe("$1.23 spent")
})

test("a translated message can move and repeat a named parameter", () => {
  const language = createI18n(() => ({ "sidebar.context.tokens": "Tokens: {count} ({count})" }))
  expect(language.t("sidebar.context.tokens", { count: 42 })).toBe("Tokens: 42 (42)")
  expect(language.t("sidebar.context.used", { percent: 75 })).toBe("75% used")
})

test("parameter values stay literal instead of becoming replacement patterns or placeholders", () => {
  const language = createI18n(() => ({ "sidebar.context.tokens": "{count} / {count}" }))
  expect(language.t("sidebar.context.tokens", { count: "$& {count}" })).toBe("$& {count} / $& {count}")
})

test("unknown placeholders do not read inherited properties", () => {
  const language = createI18n(() => ({ "sidebar.context.tokens": "{count} {toString} {missing}" }))
  expect(language.t("sidebar.context.tokens", { count: 0 })).toBe("0 {toString} {missing}")
})
