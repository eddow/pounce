import fs from 'node:fs'
import { transformSync } from '@babel/core'
import { createPounceBabelPlugins } from './plugin/index'

const code = fs.readFileSync('../ui/src/demo/components/ButtonDemo.tsx', 'utf8')

const result = transformSync(code, {
	filename: 'ButtonDemo.tsx',
	plugins: createPounceBabelPlugins({ isTSX: true }),
	babelrc: false,
	configFile: false,
})

console.log(result?.code)
