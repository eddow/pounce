
import { api } from '@pounce/board'
import { reactive } from 'mutts'
import { paymentApi } from '../../lib/api.js'

interface CartItem {
	productId: string
	quantity: number
}

export default function Checkout() {
	const cartReq = api<CartItem[]>("/cart").get()

	const state = reactive({
		cart: cartReq.hydrated || [] as CartItem[],
		isProcessing: false,
		paymentResult: null as string | null
	})

	if (!cartReq.hydrated) {
		cartReq.then(data => state.cart = data)
	}

	const processCheckout = async () => {
		state.isProcessing = true
		state.paymentResult = null

		try {
			// Calculate pseudo total
			const total = state.cart.reduce((sum, item) => sum + (item.quantity * 10), 0) // Mock price logic

			const result = await paymentApi.processPayment({
				items: state.cart,
				total
			})

			if (result.success) {
				state.paymentResult = `Success! Transaction ID: ${result.transactionId}`
				// Clear cart after successful payment
				await api("/cart").del()
				state.cart = []
			} else {
				state.paymentResult = `Payment Failed: ${result.message}`
			}
		} catch (e) {
			console.error(e)
			state.paymentResult = "An error occurred during checkout."
		} finally {
			state.isProcessing = false
		}
	}

	return (
		<div class="checkout-page">
			<h1>Checkout</h1>

			<if condition={state.cart.length > 0}>
				<div class="checkout-summary">
					<h2>Order Summary</h2>
					<ul>
						<for each={state.cart}>
							{(item) => (
								<li>Product {item.productId} x {item.quantity}</li>
							)}
						</for>
					</ul>

					<button
						onClick={() => processCheckout()}
						disabled={state.isProcessing}
					>
						{state.isProcessing ? 'Processing...' : 'Pay Now'}
					</button>
				</div>
			</if>

			<if condition={state.cart.length === 0 && !state.paymentResult}>
				<p>Your cart is empty. <a href="/products">Go shopping</a></p>
			</if>

			<if condition={state.paymentResult}>
				<div class={`result ${state.paymentResult.startsWith('Success') ? 'success' : 'error'}`}>
					{state.paymentResult}
				</div>
				<if condition={state.paymentResult.startsWith('Success')}>
					<p><a href="/products">Continue Shopping</a></p>
				</if>
			</if>
		</div>
	)
}
