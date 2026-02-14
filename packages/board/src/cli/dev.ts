import { getRequestListener } from '@hono/node-server'
import { Hono } from 'hono'
import * as fs from 'node:fs'
import { createServer } from 'node:http'
import * as path from 'node:path'
import { createServer as createViteServer } from 'vite'
import { createPounceMiddleware, clearRouteTreeCache } from '../adapters/hono.js'
import { api, enableSSR } from '../lib/http/client.js'
import { fileURLToPath } from 'node:url'
import { matchRoute, buildRouteTree } from '../lib/router/index.js'
import { withSSRContext, injectSSRContent } from '../lib/ssr/utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface DevServerOptions {
	port?: number
	hmrPort?: number
	routesDir?: string
	entryHtml?: string
}

/**
 * Run the pounce-board development server.
 */
export async function runDevServer(options: DevServerOptions = {}) {
	enableSSR()
	const port = options.port ?? 3000
	const hmrPort = options.hmrPort ?? (port + 20000)
	const routesDir = options.routesDir ?? './routes'
	const entryHtml = options.entryHtml ?? './index.html'

	const app = new Hono()

	// 1. Initialize Vite in middleware mode
	const vite = await createViteServer({
		server: { 
			middlewareMode: true,
			hmr: {
				port: hmrPort
			},
			fs: {
				allow: [
					path.resolve('.'),
					path.resolve(__dirname, '../../../../mutts'),
					path.resolve(__dirname, '../../../core'),
				]
			}
		},
		appType: 'custom',
		resolve: {
			alias: {
				'@pounce/core/jsx-runtime': path.resolve(__dirname, '../../../core/src/runtime/jsx-runtime.ts'),
				'@pounce/core/jsx-dev-runtime': path.resolve(__dirname, '../../../core/src/runtime/jsx-dev-runtime.ts'),
				'@pounce/core': path.resolve(__dirname, '../../../core/src/lib'),
				'mutts': path.resolve(__dirname, '../../../../mutts/src'),
				'@pounce/board/client': path.resolve(__dirname, '../lib/http/client.ts'),
				'@pounce/board/server': path.resolve(__dirname, '../lib/ssr/utils.ts'),
				'@pounce/board': path.resolve(__dirname, '../index.ts'),
			}
		},
		optimizeDeps: {
			exclude: ['mutts', '@pounce/core']
		},
		ssr: {
			noExternal: ['mutts', '@pounce/core']
		}
	})

	// 2. Attach @pounce/board middleware
	app.use('*', createPounceMiddleware({ 
		routesDir,
		importFn: (p) => vite.ssrLoadModule(p)
	}))

	vite.watcher.on('all', (event, filePath) => {
		const absoluteRoutesDir = path.resolve(routesDir)
		if (filePath.startsWith(absoluteRoutesDir)) {
			console.log(`[pounce dev] Route change detected (${event}), refreshing route tree...`)
			clearRouteTreeCache()
		}
	})

	// 3. Fallback HTML handler
	app.get('*', async (c) => {
		const url = new URL(c.req.url)
		const origin = `${url.protocol}//${url.host}`
		
		const { result } = await withSSRContext(async () => {
			try {
				await api(url.pathname).get().catch(() => {})
			} catch (e) {}

			const indexPath = path.resolve(entryHtml)
			if (!fs.existsSync(indexPath)) {
				return c.text(`Entry HTML not found: \${indexPath}`, 404)
			}

			let template = fs.readFileSync(indexPath, 'utf-8')
			template = await vite.transformIndexHtml(c.req.url, template)
			
			const routeTree = await buildRouteTree(routesDir, (p) => vite.ssrLoadModule(p))
			const match = matchRoute(url.pathname, routeTree, 'GET')
			
			if (match && match.component) {
				const { renderToStringAsync, withSSR } = await vite.ssrLoadModule('@pounce/core/server')
				const { h } = await vite.ssrLoadModule('@pounce/core')
				const { flushSSRPromises } = await vite.ssrLoadModule('@pounce/board/server')

				if (typeof match.component !== 'function') return template

				const renderedHtml = await withSSR(async () => {
					let app = h(match.component, { params: match.params })
					if (match.layouts) {
						for (let i = match.layouts.length - 1; i >= 0; i--) {
							app = h(match.layouts[i], { params: match.params }, app)
						}
					}
					return await renderToStringAsync(app as any, undefined, { collectPromises: flushSSRPromises })
				})

				template = template.replace('<div id="root"></div>', `<div id="root">\${renderedHtml}</div>`)
			}
			return template
		}, origin)

		if (result instanceof Response) return result
		const finalHtml = await injectSSRContent(result)
		return c.html(finalHtml)
	})

	const honoListener = getRequestListener(app.fetch)
	const server = createServer(async (req, res) => {
		vite.middlewares(req, res, async () => {
			honoListener(req, res)
		})
	})

	console.log(`\n  🚀 Pounce-Board dev server starting...`)
	server.listen(port, () => {
		console.log(`  http://localhost:\${port} (HMR: \${hmrPort})\n`)
	})

	const shutdown = async () => {
		console.log('\n  🛑 Pounce-Board dev server shutting down...')
		await vite.close()
		server.close(() => { process.exit(0) })
	}

	process.on('SIGINT', shutdown)
	process.on('SIGTERM', shutdown)
}
