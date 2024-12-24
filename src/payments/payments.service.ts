import { Inject, Injectable, Logger } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { CreateSessionDto } from './dto/create-session.dto';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
	private readonly stripe = new Stripe(envs.stripe_secret);
	private readonly logger = new Logger('PaymentService');

	constructor(@Inject('NATS_SERVICE') private readonly client: ClientProxy) {}

	async createPaymentSession(request: CreateSessionDto) {
		const session = await this.stripe.checkout.sessions.create({
			// ID DB ORDEN
			payment_intent_data: {
				metadata: {
					orderId: request.orderId,
				},
			},
			line_items: request.items.map((item) => ({
				price_data: {
					currency: 'cop',
					product_data: {
						name: item.name,
					},
					unit_amount: Math.round(item.price * 100), // 500000 / 100 = 5000
				},
				quantity: item.quantity,
			})),
			mode: 'payment',
			success_url: envs.stripe_success_url,
			cancel_url: envs.stripe_cancel_url,
		});

		return {
			cancelUrl: session.cancel_url,
			successUrl: session.success_url,
			url: session.url,
		};
	}

	async stripeWebhook(req: Request, res: Response) {
		const sig = req.headers['stripe-signature'];

		let event: Stripe.Event;

		try {
			event = this.stripe.webhooks.constructEvent(
				req.rawBody,
				sig,
				envs.stripe_endpoint_secret,
			);
		} catch (e) {
			return res.status(400).send({
				ok: false,
				message: e.message,
			});
		}

		switch (event.type) {
			case 'charge.succeeded':
				const chargeSucceded = event.data.object;
				const payload = {
					stripeId: chargeSucceded.id,
					orderId: chargeSucceded.metadata.orderId,
					receiptUrl: chargeSucceded.receipt_url,
				};

				// this.logger.log(payload);
				this.client.emit('payment.succeeded', payload);

				break;

			default:
				console.log('Event not handled');
				break;
		}

		return res.status(200).send({
			sig,
		});
	}
}
