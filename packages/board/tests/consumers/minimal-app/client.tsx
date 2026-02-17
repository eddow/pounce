import { latch } from '@pounce/core'
import { intercept } from '@pounce/board'
import Home from './routes/index.tsx'
import UserDetail from './routes/users/[id]/index.tsx'
import UserList from './routes/users/list.tsx'

// Sample interceptor for manual verification
intercept('**', async (req: Request, next: (req: Request) => Promise<any>) => {
	console.log(`[minimal-app] API Request: ${req.method} ${req.url}`)
	return next(req)
})

const path = window.location.pathname

if (path === '/') {
	latch(document.getElementById('root')!, <Home />)
} else if (path === '/users/list') {
	latch(document.getElementById('root')!, <UserList />)
} else if (path.startsWith('/users/')) {
	const id = path.split('/')[2]
	latch(document.getElementById('root')!, <UserDetail params={{ id }} />)
}
