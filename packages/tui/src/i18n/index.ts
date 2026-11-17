import { dict } from "./en"
import type { Key } from "./en"

export type Dictionary = Record<Key, string>

type Parameter<T extends string> = T extends `${string}{${infer Name}}${infer Rest}` ? Name | Parameter<Rest> : never
type Args<K extends Key> = [Parameter<(typeof dict)[K]>] extends [never]
  ? []
  : [params: Record<Parameter<(typeof dict)[K]>, string | number>]

// Read the source on every call so a later locale provider can supply reactive catalogs.
export function createI18n(source: () => Partial<Dictionary> = () => dict) {
  return {
    t: <K extends Key>(key: K, ...[params]: Args<K>) => {
      const text = source()[key] ?? dict[key]
      const values: Record<string, string | number> | undefined = params
      if (!values) return text
      return text.replace(/\{(\w+)\}/g, (match, name: string) =>
        Object.hasOwn(values, name) ? String(values[name]) : match,
      )
    },
  }
}

export const i18n = createI18n()
