import { type AppShellProps, appShellModel } from '@pounce/ui/models'

export type { AppShellProps }

export function AppShell(props: AppShellProps) {
	const model = appShellModel(props)
	return (
		<div style="display:flex;flex-direction:column;min-height:100vh">
			<header
				use={model.setupShadow}
				style="position:sticky;top:0;z-index:100;background:var(--pico-background-color,#fff)"
			>
				{props.header}
			</header>
			<main style="flex:1">{props.children}</main>
		</div>
	)
}
