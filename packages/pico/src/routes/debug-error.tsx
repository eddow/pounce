export default function ErrorRoute() {
	throw new Error('Test error from ErrorRoute')
	return null as unknown as any
}
