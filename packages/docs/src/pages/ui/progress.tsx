import { reactive } from 'mutts'
import { Progress, Select, Switch, Stack, Inline } from '@pounce/ui'
import { Section, Demo, ApiTable } from '../../components'

const playgroundSource = `<Progress
  value={state.indeterminate ? undefined : state.value}
  max={state.max}
  variant={state.variant}
/>`

function ProgressPlayground() {
  const state = reactive({
    value: 65,
    max: 100,
    variant: 'primary',
    indeterminate: false,
  })

  return (
    <Stack gap="md">
      <Inline gap="md" wrap>
        <label>
          variant
          <Select value={state.variant}>
            <option value="primary">primary</option>
            <option value="success">success</option>
            <option value="danger">danger</option>
            <option value="warning">warning</option>
          </Select>
        </label>
        <label>
          value
          <input type="range" min={0} max={state.max} value={state.value} disabled={state.indeterminate} />
          <span style="margin-left: 0.5rem">{state.value}</span>
        </label>
        <label>
          max
          <input type="number" value={state.max} min={1} style="width: 5rem" />
        </label>
      </Inline>
      <Inline gap="md">
        <Switch checked={state.indeterminate}>indeterminate</Switch>
      </Inline>
      <hr />
      <Progress
        value={state.indeterminate ? undefined : state.value}
        max={state.max}
        variant={state.variant}
      />
    </Stack>
  )
}

export default function ProgressPage() {
  return (
    <article>
      <h1>Progress</h1>
      <p>
        Thin wrapper around native <code>{'<progress>'}</code> with variant support.
        Omit <code>value</code> for indeterminate mode.
      </p>

      <Section title="Playground">
        <p>Drag the slider, change the variant, or toggle indeterminate mode.</p>
        <Demo
          title="Progress Playground"
          source={playgroundSource}
          component={<ProgressPlayground />}
        />
      </Section>

      <Section title="API Reference">
        <h4>ProgressProps</h4>
        <ApiTable props={[
          { name: 'value', type: 'number', description: 'Current progress value. Omit or set undefined for indeterminate mode', required: false },
          { name: 'max', type: 'number', description: 'Maximum value. Default: 100', required: false },
          { name: 'variant', type: 'string', description: "Visual variant. Default: 'primary'", required: false },
          { name: 'el', type: 'JSX.GlobalHTMLAttributes', description: 'Pass-through HTML attributes', required: false },
        ]} />
      </Section>
    </article>
  )
}
