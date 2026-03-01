import { expose } from '@pounce/board'

export default expose({
  provide: async (req) => ({
    siteName: 'Pounce Demo',
    buildTime: new Date().toISOString(),
  }),
})
