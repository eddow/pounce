import { type ProgressProps, progressModel } from '@sursaut/ui/models'

export function Progress(props: ProgressProps) {
	const model = progressModel(props)
	return <progress {...props.el} role="progressbar" {...model.progress} />
}
