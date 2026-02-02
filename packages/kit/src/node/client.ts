import { setClient } from '../client/shared.js'
import { createClientProxy } from '../node/bootstrap.js'

setClient(createClientProxy())

export { client } from '../client/shared.js'
