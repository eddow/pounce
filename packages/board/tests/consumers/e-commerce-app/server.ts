
import { Hono } from 'hono'
import { createPounceMiddleware } from '@pounce/board/adapters/hono'
import { getRequestListener } from '@hono/node-server'
import { createServer } from 'http'

const port = Number(process.env.PORT) || 3002

const app = new Hono()
app.use('*', createPounceMiddleware({
	routesDir: './routes',
}))

const server = createServer(getRequestListener(app.fetch))

server.listen(port, () => {
	console.log(`E-Commerce App running at http://localhost:${port}`)
})
