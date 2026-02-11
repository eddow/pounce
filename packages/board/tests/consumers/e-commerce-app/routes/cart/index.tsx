
import { api } from '@pounce/board'
import { reactive } from 'mutts'

interface CartItem {
	productId: string
	quantity: number
}

export default function Cart() {
	const cartReq = api<CartItem[]>("/cart").get()

	const state = reactive({
		cart: cartReq.hydrated || [] as CartItem[]
	})

	if (!cartReq.hydrated) {
		cartReq.then(data => state.cart = data)
	}

	const clearCart = async () => {
		await api("/cart").del()
		state.cart = []
	}

	return (
		<div class="cart-page">
			<h1>Shopping Cart</h1>
			<if condition={state.cart.length === 0}>
				<p>Your cart is empty.</p>
			</if>
			<if condition={state.cart.length > 0}>
				<ul>
					<for each={state.cart}>
						{(item) => (
							<li>
								Product ID: {item.productId}, Quantity: {item.quantity}
							</li>
						)}
					</for>
				</ul>
				<button onClick={() => clearCart()}>Clear Cart</button>
				<a href="/checkout">Proceed to Checkout</a>
			</if>
		</div>
	)
}
