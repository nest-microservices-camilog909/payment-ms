import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { Request, Response } from 'express';

@Controller('payments')
export class PaymentsController {
	constructor(private readonly paymentsService: PaymentsService) {}

	@Post('session')
	createPaymentSession(@Body() request: CreateSessionDto) {
		return this.paymentsService.createPaymentSession(request);
	}

	@Get('success')
	success() {
		return {
			ok: true,
			message: 'Payment successful',
		};
	}

	@Get('cancel')
	cancel() {
		return {
			ok: true,
			message: 'Payment cancelled',
		};
	}

	@Post('webhook')
	async stripeWebhook(@Req() req: Request, @Res() res: Response) {
		return this.paymentsService.stripeWebhook(req, res);
	}
}
