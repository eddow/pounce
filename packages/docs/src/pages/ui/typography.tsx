import { Heading, Inline, Link, Select, Stack, Switch, Text } from '@pounce/ui'
import { reactive } from 'mutts'
import { ApiTable, Demo, Section } from '../../components'

const headingSource = `<Heading level={state.level} variant={state.variant} align={state.align}>
  Hello World
</Heading>`

const textSource = `<Text size={state.size} variant={state.variant} muted={state.muted}>
  The quick brown fox jumps over the lazy dog.
</Text>`

const linkSource = `<Link href="/ui/button" variant={state.variant} underline={state.underline}>
  Go to Buttons
</Link>`

function HeadingDemo() {
	const state = reactive({
		level: '2',
		variant: 'primary',
		align: 'start' as 'start' | 'center' | 'end',
	})
	return (
		<Stack gap="md">
			<Inline gap="md" wrap>
				<label>
					level
					<Select value={state.level}>
						<option value="1">1</option>
						<option value="2">2</option>
						<option value="3">3</option>
						<option value="4">4</option>
						<option value="5">5</option>
						<option value="6">6</option>
					</Select>
				</label>
				<label>
					variant
					<Select value={state.variant}>
						<option value="primary">primary</option>
						<option value="secondary">secondary</option>
						<option value="contrast">contrast</option>
						<option value="success">success</option>
						<option value="warning">warning</option>
						<option value="danger">danger</option>
					</Select>
				</label>
				<label>
					align
					<Select value={state.align}>
						<option value="start">start</option>
						<option value="center">center</option>
						<option value="end">end</option>
					</Select>
				</label>
			</Inline>
			<hr />
			<Heading
				level={Number(state.level) as 1 | 2 | 3 | 4 | 5 | 6}
				variant={state.variant}
				align={state.align}
			>
				Hello World
			</Heading>
		</Stack>
	)
}

function TextDemo() {
	const state = reactive({
		size: 'md' as 'sm' | 'md' | 'lg',
		variant: 'primary',
		muted: false,
	})
	return (
		<Stack gap="md">
			<Inline gap="md" wrap>
				<label>
					size
					<Select value={state.size}>
						<option value="sm">sm</option>
						<option value="md">md</option>
						<option value="lg">lg</option>
					</Select>
				</label>
				<label>
					variant
					<Select value={state.variant}>
						<option value="primary">primary</option>
						<option value="secondary">secondary</option>
						<option value="contrast">contrast</option>
						<option value="success">success</option>
						<option value="warning">warning</option>
						<option value="danger">danger</option>
					</Select>
				</label>
				<Switch checked={state.muted}>muted</Switch>
			</Inline>
			<hr />
			<Text size={state.size} variant={state.variant} muted={state.muted}>
				The quick brown fox jumps over the lazy dog. This paragraph demonstrates the Text component
				with configurable size, variant, and muted state.
			</Text>
		</Stack>
	)
}

function LinkDemo() {
	const state = reactive({
		variant: 'primary',
		underline: true,
	})
	return (
		<Stack gap="md">
			<Inline gap="md" wrap>
				<label>
					variant
					<Select value={state.variant}>
						<option value="primary">primary</option>
						<option value="secondary">secondary</option>
						<option value="contrast">contrast</option>
						<option value="success">success</option>
						<option value="danger">danger</option>
					</Select>
				</label>
				<Switch checked={state.underline}>underline</Switch>
			</Inline>
			<hr />
			<Inline gap="md">
				<Link href="/ui/button" variant={state.variant} underline={state.underline}>
					Go to Buttons
				</Link>
				<Link href="/ui/forms" variant={state.variant} underline={state.underline}>
					Go to Forms
				</Link>
			</Inline>
		</Stack>
	)
}

export default function TypographyPage() {
	return (
		<article>
			<h1>Typography</h1>
			<p>
				Semantic text components: <code>Heading</code>, <code>Text</code>, and <code>Link</code>.
				All support variant coloring via the adapter pattern.
			</p>

			<Section title="Heading">
				<p>
					Renders a heading element (<code>h1</code>\u2013<code>h6</code>) with responsive font
					sizing, variant coloring, and text alignment. The <code>tag</code> prop overrides the
					element tag independently of the visual <code>level</code>.
				</p>
				<Demo title="Heading" source={headingSource} component={<HeadingDemo />} />
				<ApiTable
					props={[
						{
							name: 'level',
							type: '1 | 2 | 3 | 4 | 5 | 6',
							description: 'Visual heading level (controls font size). Default: 2',
							required: false,
						},
						{
							name: 'tag',
							type: 'string',
							description: 'HTML element tag override. Default: h{level}',
							required: false,
						},
						{
							name: 'variant',
							type: 'string',
							description: "Color variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'align',
							type: "'start' | 'center' | 'end'",
							description: "Text alignment. Default: 'start'",
							required: false,
						},
						{
							name: 'el',
							type: 'JSX.GlobalHTMLAttributes',
							description: 'Pass-through HTML attributes',
							required: false,
						},
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Heading content',
							required: false,
						},
					]}
				/>
			</Section>

			<Section title="Text">
				<p>
					Paragraph text with size presets and muted mode. Uses <code>{'<dynamic>'}</code>{' '}
					internally \u2014 the <code>tag</code> prop defaults to <code>p</code>.
				</p>
				<Demo title="Text" source={textSource} component={<TextDemo />} />
				<ApiTable
					props={[
						{
							name: 'size',
							type: "'sm' | 'md' | 'lg'",
							description: "Font size preset. Default: 'md'",
							required: false,
						},
						{
							name: 'variant',
							type: 'string',
							description: "Color variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'muted',
							type: 'boolean',
							description: 'Reduced opacity text. Default: false',
							required: false,
						},
						{
							name: 'tag',
							type: 'string',
							description: "HTML element tag. Default: 'p'",
							required: false,
						},
						{
							name: 'el',
							type: 'JSX.GlobalHTMLAttributes',
							description: 'Pass-through HTML attributes',
							required: false,
						},
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Text content',
							required: false,
						},
					]}
				/>
			</Section>

			<Section title="Link">
				<p>
					Styled anchor using <code>{'<A>'}</code> from <code>@pounce/kit</code> for client-side
					routing. Supports variant coloring and optional underline.
				</p>
				<Demo title="Link" source={linkSource} component={<LinkDemo />} />
				<ApiTable
					props={[
						{
							name: 'variant',
							type: 'string',
							description: "Color variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'underline',
							type: 'boolean',
							description: 'Show text underline. Default: true',
							required: false,
						},
						{
							name: '...native',
							type: 'JSX.IntrinsicElements["a"]',
							description: 'All native <a> attributes (href, target, etc.)',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}
