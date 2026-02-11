import { defineRoute } from '@pounce/board'/server'

// Simple in-memory cart
interface CartItem {
    productId: string
    quantity: number
}

const cart: CartItem[] = []

export async function get(_ctx: RequestContext) {
    return {
        status: 200,
        data: cart
    }
}

export async function post({ request }: RequestContext) {
    try {
        const body = await request.json()
        const { productId, quantity } = body
        
        const existing = cart.find(item => item.productId === productId)
        if (existing) {
            existing.quantity += quantity
        } else {
            cart.push({ productId, quantity })
        }

        return {
            status: 201,
            data: cart
        }
    } catch {
        return {
            status: 400,
            error: 'Invalid JSON'
        }
    }
}

export async function del({ request }: RequestContext) {
    // Clear cart or remove item
    try {
        const url = new URL(request.url)
        const productId = url.searchParams.get('productId')
        
        if (productId) {
            const index = cart.findIndex(item => item.productId === productId)
            if (index !== -1) cart.splice(index, 1)
        } else {
            cart.length = 0
        }

        return { status: 200, data: cart }
    } catch {
        return { status: 500, error: 'Failed to clear cart' }
    }
}
