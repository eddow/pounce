import { effect, reactive } from 'mutts'
import { Stars, Select, Switch, Stack, Inline } from '@pounce/ui'
import { Section, Demo, ApiTable } from '../../components'

const playgroundSource = `<Stars
  value={state.value}
  maximum={state.maximum}
  readonly={state.readonly}
  size={state.size}
/>`

function StarsPlayground() {
  const state = reactive({
    value: 3 as number | readonly [number, number],
    maximum: 5,
    readonly: false,
    size: '1.5rem',
    rangeMode: false,
  })

  effect(() => {
    state.value = state.rangeMode ? [2, 4] : 3
  })

  return (
    <Stack gap="md">
      <Inline gap="md" wrap>
        <label>
          maximum
          <input type="number" value={state.maximum} min={1} max={20} style="width: 5rem" />
        </label>
        <label>
          size
          <Select value={state.size}>
            <option value="1rem">1rem</option>
            <option value="1.5rem">1.5rem</option>
            <option value="2rem">2rem</option>
            <option value="3rem">3rem</option>
          </Select>
        </label>
      </Inline>
      <Inline gap="md">
        <Switch checked={state.readonly}>readonly</Switch>
        <Switch checked={state.rangeMode}>range mode</Switch>
      </Inline>
      <hr />
      <Stars
        value={state.value}
        maximum={state.maximum}
        readonly={state.readonly}
        size={state.size}
        onChange={(v) => { state.value = v }}
      />
      <span style="opacity: 0.6">
        Value: {Array.isArray(state.value) ? `[${state.value[0]}, ${state.value[1]}]` : String(state.value)}
      </span>
    </Stack>
  )
}

export default function StarsPage() {
  return (
    <article>
      <h1>Stars</h1>
      <p>
        Star rating with single value or range selection.
        Click to set value. Drag to adjust range endpoints.
      </p>

      <Section title="Playground">
        <p>Toggle readonly, change the max, or switch to range mode.</p>
        <Demo
          title="Stars Playground"
          source={playgroundSource}
          component={<StarsPlayground />}
        />
      </Section>

      <Section title="API Reference">
        <h4>StarsProps</h4>
        <ApiTable props={[
          { name: 'value', type: 'number | [number, number]', description: 'Current rating — single number or [min, max] range', required: true },
          { name: 'maximum', type: 'number', description: 'Number of stars to display. Default: 5', required: false },
          { name: 'onChange', type: '(value: number | [number, number]) => void', description: 'Called when the user changes the value', required: false },
          { name: 'readonly', type: 'boolean', description: 'Disable interaction. Default: false', required: false },
          { name: 'size', type: 'string', description: "Icon size (CSS value). Default: '1.5rem'", required: false },
          { name: 'before', type: 'string', description: "Icon name for filled stars. Default: 'star-filled'", required: false },
          { name: 'after', type: 'string', description: "Icon name for empty stars. Default: 'star-outline'", required: false },
          { name: 'inside', type: 'string', description: 'Icon name for range interior stars (defaults to before)', required: false },
          { name: 'zeroElement', type: 'string', description: 'Icon name for the "zero" position (rendered before star 1)', required: false },
        ]} />
      </Section>
    </article>
  )
}
