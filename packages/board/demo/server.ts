import { createSursautMiddleware } from '@sursaut/board/adapters/hono'
import { Hono } from 'hono'

const app = new Hono()
app.use('*', createSursautMiddleware({ routesDir: './routes' }))
export default app
