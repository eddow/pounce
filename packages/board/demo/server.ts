import { Hono } from 'hono'
import { createPounceMiddleware } from '@pounce/board/adapters/hono'

const app = new Hono()
app.use('*', createPounceMiddleware({ routesDir: './routes' }))
export default app
