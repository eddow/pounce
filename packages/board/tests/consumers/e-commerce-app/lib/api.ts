
import { defineProxy } from '@pounce/board'

interface OrderDetails {
    items: { productId: string; quantity: number }[]
    total: number
}

interface PaymentResult {
    success: boolean
    transactionId: string
    message?: string
}

export const paymentApi = defineProxy({
    baseUrl: 'https://payment-gateway.example.com',
    endpoints: {
        processPayment: {
            method: 'POST',
            path: '/process',
            mock: () => {
                // Mock successful payment
                return {
                    success: true,
                    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    message: 'Payment processed successfully'
                } as PaymentResult
            }
        }
    }
})
