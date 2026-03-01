import { defineProxy } from '@pounce/board'

export interface Comment {
  id: number
  postId: number
  name: string
  body: string
}

export const commentsApi = defineProxy({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  endpoints: {
    getComments: {
      method: 'GET',
      path: '/posts/{postId}/comments',
      mock: (params) => [
        { id: 1, postId: Number(params.postId), name: 'Alice', body: 'Great post!' },
        { id: 2, postId: Number(params.postId), name: 'Bob', body: 'Thanks for sharing.' },
      ] as Comment[],
    },
  },
})
