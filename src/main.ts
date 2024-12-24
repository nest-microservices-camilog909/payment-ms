import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';
import { json } from 'body-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
	const logger = new Logger('Payment MS Main');

	const app = await NestFactory.create(AppModule);
	app.use(
		json({
			verify: (req: any, res, buf, encoding) => {
				if (buf && buf.length) {
					req.rawBody = buf.toString(encoding || 'utf8');
				}
			},
		}),
	);

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
		}),
	);

	app.connectMicroservice<MicroserviceOptions>(
		{
			transport: Transport.NATS,
			options: {
				servers: envs.nats_servers,
			},
		},
		{
			inheritAppConfig: true,
		},
	);

	await app.startAllMicroservices();
	await app.listen(envs.port);
	logger.log('Payment microservice running on port ' + envs.port);
}
bootstrap();
