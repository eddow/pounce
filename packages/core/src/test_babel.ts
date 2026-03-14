import fs from 'node:fs'
import { transformSync } from '@babel/core'
import { createSursautBabelPlugins } from './plugin/index'

const code = fs.readFileSync('../../ui/demo/components/ButtonDemo.tsx', 'utf8')

const result = transformSync(code, {
	filename: 'ButtonDemo.tsx',
	plugins: createSursautBabelPlugins({ isTSX: true }),
	babelrc: false,
	configFile: false,
})

console.log(result?.code)
