export const dict = {
  "dialog.group": "Dialog",
  "dialog.alert.confirm": "Confirm alert",
  "dialog.alert.ok": "ok",
  "sidebar.context.title": "Context",
  "sidebar.context.tokens.one": "{count} token",
  "sidebar.context.tokens.other": "{count} tokens",
  "sidebar.context.used": "{percent}% used",
  "sidebar.context.spent": "{amount} spent",
} as const

export type Key = keyof typeof dict

type PluralBase = {
  [K in Key]: K extends `${infer Base}.one` ? (`${Base}.other` extends Key ? Base : never) : never
}[Key]
type Plural<K extends PluralBase> = K

// Explicit plural bases must have English .one/.other forms; ordinary keys may use either suffix.
export type PluralKey = Plural<"sidebar.context.tokens">
