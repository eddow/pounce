import { Hono } from 'hono'
import { createSursautMiddleware } from '@sursaut/board/adapters/hono'

const app = new Hono()
app.use('*', createSursautMiddleware({ routesDir: './routes' }))
export default app
