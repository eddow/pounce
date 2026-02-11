import { reactive } from 'mutts'
import { InfiniteScroll, Select, Switch, Stack, Inline } from '@pounce/ui'
import { Section, Demo, Code, ApiTable } from '../../components'

const fixedSource = `<InfiniteScroll items={rows} itemHeight={40}>
  {(item, i) => <div>{i}: {item}</div>}
</InfiniteScroll>`

const variableSource = `<InfiniteScroll
  items={messages}
  itemHeight={(msg) => msg.long ? 80 : 40}
  stickyLast
>
  {(msg) => <div>{msg.text}</div>}
</InfiniteScroll>`

function FixedHeightDemo() {
  const items = Array.from({ length: 500 }, (_, i) => `Row ${i + 1}`)
  const state = reactive({ height: 40, sticky: true })
  return (
    <Stack gap="md">
      <Inline gap="md" wrap>
        <label>
          itemHeight
          <Select value={String(state.height)}>
            <option value="30">30px</option>
            <option value="40">40px</option>
            <option value="60">60px</option>
          </Select>
        </label>
        <Switch checked={state.sticky}>stickyLast</Switch>
      </Inline>
      <hr />
      <div style="height: 300px; border: 1px solid var(--pounce-border, #e5e7eb); border-radius: 0.25rem">
        <InfiniteScroll items={items} itemHeight={Number(state.height)} stickyLast={state.sticky}>
          {(item: string, i: number) => (
            <div style="padding: 0.5rem 1rem; border-bottom: 1px solid var(--pounce-border, #eee)">
              {i}: {item}
            </div>
          )}
        </InfiniteScroll>
      </div>
      <span style="opacity: 0.6">{items.length} items, only visible rows rendered</span>
    </Stack>
  )
}

const variableExample = `// Variable height — provide an estimator function.
// Actual heights are measured via ResizeObserver
// and the offset table is corrected on the fly.

<InfiniteScroll
  items={messages}
  itemHeight={(msg) => msg.hasImage ? 200 : 48}
  stickyLast
>
  {(msg) => <MessageBubble message={msg} />}
</InfiniteScroll>`

export default function InfiniteScrollPage() {
  return (
    <article>
      <h1>InfiniteScroll</h1>
      <p>
        Virtualized scrollable list — renders only visible items plus a small buffer.
        Supports both fixed and variable row heights.
      </p>

      <Section title="Fixed Height">
        <p>
          When <code>itemHeight</code> is a number, the fast path is used — no measurement overhead.
        </p>
        <Demo title="Fixed Height" source={fixedSource} component={<FixedHeightDemo />} />
      </Section>

      <Section title="Variable Height">
        <p>
          When <code>itemHeight</code> is a function, it provides an estimated height per item.
          Actual heights are measured via <code>ResizeObserver</code> and the offset table is
          corrected on the fly with scroll anchor correction.
        </p>
        <Code code={variableExample} lang="tsx" />
      </Section>

      <Section title="API Reference">
        <h4>InfiniteScrollProps{'<T>'}</h4>
        <ApiTable props={[
          { name: 'items', type: 'T[]', description: 'Data array to render', required: true },
          { name: 'itemHeight', type: 'number | ((item: T, index: number) => number)', description: 'Fixed row height (px) or estimator function for variable heights', required: true },
          { name: 'children', type: '(item: T, index: number) => JSX.Element', description: 'Row renderer — receives item and its index', required: true },
          { name: 'estimatedItemHeight', type: 'number', description: 'Fallback height for unmeasured items in variable mode. Default: 40', required: false },
          { name: 'stickyLast', type: 'boolean', description: 'Auto-scroll to bottom when new items are appended. Default: true', required: false },
          { name: 'el', type: 'JSX.GlobalHTMLAttributes', description: 'Pass-through HTML attributes for the scroll container', required: false },
        ]} />
      </Section>
    </article>
  )
}
