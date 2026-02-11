
import { defineProxy } from '@pounce/board'

export interface Comment {
  id: number
  postId: number
  name: string
  email: string
  body: string
}

export const commentsApi = defineProxy({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  endpoints: {
    getComments: {
      method: 'GET',
      path: '/posts/{postId}/comments',
      mock: (params) => {
        // Mock data for development
        return [
          {
            id: 1,
            postId: Number(params.postId),
            name: 'Alice Smith',
            email: 'alice@example.com',
            body: 'Great post! I really enjoyed reading this.'
          },
          {
            id: 2,
            postId: Number(params.postId),
            name: 'Bob Jones',
            email: 'bob@example.com',
            body: 'Thanks for sharing this information.'
          }
        ] as Comment[]
      }
    }
  }
})
