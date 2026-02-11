
import { api } from '@pounce/board'
import { reactive } from 'mutts'
import type { Product } from './index.js'

export default function ProductCatalog() {
	const productsReq = api<Product[]>("/products").get()

	const state = reactive({
		products: productsReq.hydrated || [] as Product[]
	})

	if (!productsReq.hydrated) {
		productsReq.then(data => state.products = data)
	}

	const addToCart = async (product: Product) => {
		try {
			await api("/cart").post({ productId: product.id, quantity: 1 })
			alert(`Added ${product.name} to cart!`)
		} catch (e) {
			console.error(e)
			alert('Failed to add to cart')
		}
	}

	return (
		<div class="product-catalog">
			<h1>Featured Products</h1>
			<div class="grid">
				<for each={state.products}>
					{(product) => (
						<div class="product-card">
							<img src={product.imageUrl} alt={product.name} />
							<h3>{product.name}</h3>
							<p>${product.price}</p>
							<button onClick={() => addToCart(product)}>
								Add to Cart
							</button>
						</div>
					)}
				</for>
			</div>
			<if condition={state.products.length === 0}>
				<p>Loading products...</p>
			</if>
		</div>
	)
}
