import { reactive } from 'mutts'
// TODO: real storage hook?
export function stored<T extends Record<string, any>>(initial: T): T {
	return reactive({ ...initial }) as T
}
