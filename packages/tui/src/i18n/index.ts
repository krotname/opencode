import { dict } from "./en"
import type { Key } from "./en"

type PluralKey = Key extends infer K ? (K extends `${infer Base}.other` ? Base : never) : never
type MessageKey = Exclude<Key, `${PluralKey}.${Intl.LDMLPluralRule}`>
export type Dictionary = Record<Key, string> & Partial<Record<`${PluralKey}.${Intl.LDMLPluralRule}`, string>>

type Parameter<T extends string> = T extends `${string}{${infer Name}}${infer Rest}` ? Name | Parameter<Rest> : never
type Args<K extends Key> = [Parameter<(typeof dict)[K]>] extends [never]
  ? []
  : [params: Record<Parameter<(typeof dict)[K]>, string | number>]

// Read the source on every call so a later locale provider can supply reactive catalogs.
export function createI18n(source: () => Partial<Dictionary> = () => dict, locale: () => string = () => "en-US") {
  const format = {
    number: (value: number) => new Intl.NumberFormat(locale()).format(value),
    currency: (value: number, currency: string) =>
      new Intl.NumberFormat(locale(), { style: "currency", currency }).format(value),
  }
  return {
    format,
    t: <K extends MessageKey>(key: K, ...[params]: Args<K>) => {
      return interpolate(source()[key] ?? dict[key], params, format.number)
    },
    plural: (key: PluralKey, count: number) => {
      const category = new Intl.PluralRules(locale()).select(count)
      const catalog = source()
      const fallback = new Intl.PluralRules("en-US").select(count) === "one" ? "one" : "other"
      const text = catalog[`${key}.${category}`] ?? catalog[`${key}.other`] ?? dict[`${key}.${fallback}`]
      return interpolate(text, { count }, format.number)
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
