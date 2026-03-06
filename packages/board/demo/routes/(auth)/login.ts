import { expose } from '@pounce/board'

export default expose({
  async post(req) {
    const body = await req.raw.json()
    if (body.username === 'admin' && body.password === 'secret')
      return { token: 'fake-jwt' }
    return new Response('Unauthorized', { status: 401 })
  },
})
