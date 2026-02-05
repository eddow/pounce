/// <reference types="../src/types/jsx" />
import '../src/node'
import { Fragment, h } from '../src/lib/renderer'
import '../../../tests/setup-common'

type GlobalWithJsx = typeof globalThis & {
	h: typeof h
	Fragment: typeof Fragment
}

const g = globalThis as GlobalWithJsx

// Make h and Fragment globally available for JSX
g.h = h
g.Fragment = Fragment