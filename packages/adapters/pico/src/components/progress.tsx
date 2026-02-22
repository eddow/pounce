import { type ProgressProps, progressModel } from '@pounce/ui/models'

export function Progress(props: ProgressProps) {
	const model = progressModel(props)
	return <progress role="progressbar" {...model.progress} {...props.el} />
}
