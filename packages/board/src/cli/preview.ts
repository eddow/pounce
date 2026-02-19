import { spawn } from 'node:child_process'
import * as path from 'node:path'

export async function runPreview() {
	const cwd = process.cwd()
	const serverEntry = path.join(cwd, 'dist/server/pounce-server-entry.js')

	console.log(`🚀 Starting preview server...`)

	const proc = spawn('node', [serverEntry], {
		stdio: 'inherit',
		env: {
			...process.env,
			NODE_ENV: 'production',
		},
	})

	proc.on('close', (code) => {
		if (code !== 0) {
			console.error(`Preview server exited with code ${code}`)
			process.exit(code || 1)
		}
	})
}
