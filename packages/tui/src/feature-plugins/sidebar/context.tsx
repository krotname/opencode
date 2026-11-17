import { Plugin } from "@opencode/plugin/tui"
import { createMemo, Show } from "solid-js"
import { i18n } from "../../i18n"
import { contextUsage } from "../../util/session"

export function SidebarContext(props: { context: Plugin.Context; sessionID: string }) {
  const theme = props.context.theme
  const msg = createMemo(() => props.context.data.session.message.list(props.sessionID))
  const session = createMemo(() => props.context.data.session.get(props.sessionID))
  const cost = createMemo(() => props.context.data.session.cost(props.sessionID))

  const state = createMemo(() =>
    contextUsage(msg(), props.context.data.location.model.list(session()?.location), session()?.revert?.messageID),
  )
  const usage = createMemo(() => {
    const percent = state()?.percent
    if (percent === undefined) return
    return { percent }
  })

  return (
    <Show when={state() || cost() > 0}>
      <box>
        <text fg={theme.text.base}>
          <b>{i18n.t("sidebar.context.title")}</b>
        </text>
        <Show when={state()}>
          {(value) => (
            <>
              <text fg={theme.text.muted}>{i18n.plural("sidebar.context.tokens", value().tokens)}</text>
              <Show when={usage()}>
                {(usage) => (
                  <text fg={theme.text.muted}>{i18n.t("sidebar.context.used", { percent: usage().percent })}</text>
                )}
              </Show>
            </>
          )}
        </Show>
        <Show when={cost() > 0}>
          <text fg={theme.text.muted}>
            {i18n.t("sidebar.context.spent", { amount: i18n.format.currency(cost(), "USD") })}
          </text>
        </Show>
      </box>
    </Show>
  )
}

export default Plugin.define({
  id: "opencode.sidebar.context",
  setup(context) {
    context.ui.slot({
      append: "sidebar.content",
      render: (props) => <SidebarContext context={context} sessionID={props.sessionID} />,
    })
  },
})
