import { Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { CreateSessionDto } from './dto/create-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
	private readonly stripe = new Stripe(envs.stripe_secret);

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

		return session;
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
				console.log(event.data.object.metadata);
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
