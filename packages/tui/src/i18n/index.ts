import { dict } from "./en"
import type { Key, PluralKey } from "./en"

type MessageKey = Exclude<Key, `${PluralKey}.${Intl.LDMLPluralRule}`>
export type Dictionary = Record<Key, string> & Partial<Record<`${PluralKey}.${Intl.LDMLPluralRule}`, string>>

type Parameter<T extends string> = T extends `${string}{${infer Name}}${infer Rest}` ? Name | Parameter<Rest> : never
type Args<K extends Key> = [Parameter<(typeof dict)[K]>] extends [never]
  ? []
  : [params: Record<Parameter<(typeof dict)[K]>, string | number>]

// Read the source on every call so a later locale provider can supply reactive catalogs.
export function createI18n(source: () => Partial<Dictionary> = () => dict, locale: () => string = () => "en-US") {
  const numbers = new Map<string, Intl.NumberFormat>()
  const currencies = new Map<string, Intl.NumberFormat>()
  const number = (language: string) => {
    const formatter = numbers.get(language) ?? new Intl.NumberFormat(language)
    numbers.set(language, formatter)
    return formatter
  }
  const english = (value: number) => number("en-US").format(value)
  const format = {
    number: (value: number) => number(locale()).format(value),
    currency: (value: number, currency: string) => {
      const language = locale()
      const key = `${language}:${currency}`
      const formatter = currencies.get(key) ?? new Intl.NumberFormat(language, { style: "currency", currency })
      currencies.set(key, formatter)
      return formatter.format(value)
    },
  }
  return {
    format,
    t: <K extends MessageKey>(key: K, ...[params]: Args<K>) => {
      const text = source()[key]
      return interpolate(text ?? dict[key], params, text === undefined ? english : format.number)
    },
    plural: (key: PluralKey, count: number) => {
      const category = new Intl.PluralRules(locale()).select(count)
      const catalog = source()
      const fallback = new Intl.PluralRules("en-US").select(count) === "one" ? "one" : "other"
      const text = catalog[`${key}.${category}`] ?? catalog[`${key}.other`]
      return interpolate(text ?? dict[`${key}.${fallback}`], { count }, text === undefined ? english : format.number)
    },
  }
}

function interpolate(
  text: string,
  params: Record<string, string | number> | undefined,
  number: (value: number) => string,
) {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    if (!Object.hasOwn(params, name)) return match
    const value = params[name]
    return typeof value === "number" ? number(value) : value
  })
}

export const i18n = createI18n()
