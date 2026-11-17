export const dict = {
  "dialog.group": "Dialog",
  "dialog.alert.confirm": "Confirm alert",
  "dialog.alert.ok": "ok",
  "sidebar.context.title": "Context",
  "sidebar.context.tokens": "{count} tokens",
  "sidebar.context.used": "{percent}% used",
  "sidebar.context.spent": "{amount} spent",
} as const

export type Key = keyof typeof dict
