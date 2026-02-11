import { defineRoute } from '@pounce/board/server'

export interface Product {
    id: string
    name: string
    price: number
    description: string
    imageUrl: string
}

const products: Product[] = [
    {
        id: '1',
        name: 'Retro Camera',
        price: 199.99,
        description: 'A vintage style camera for modern photographers.',
        imageUrl: 'https://placehold.co/300x200?text=Camera'
    },
    {
        id: '2',
        name: 'Headphones',
        price: 89.99,
        description: 'Noise cancelling headphones for immersive audio.',
        imageUrl: 'https://placehold.co/300x200?text=Headphones'
    },
    {
        id: '3',
        name: 'Smart Watch',
        price: 249.99,
        description: 'Track your fitness and stay connected.',
        imageUrl: 'https://placehold.co/300x200?text=Watch'
    }
]

export async function get(_ctx: RequestContext) {
    return {
        status: 200,
        data: products
    }
}
