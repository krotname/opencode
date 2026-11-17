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

// Only these bases define plural groups; ordinary keys may end in .one or .other.
export type PluralKey = "sidebar.context.tokens"
