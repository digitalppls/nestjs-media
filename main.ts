import { NestFactory } from '@nestjs/core';

import { SharedService } from '@app/shared';

import { MediaModule } from './media.module';
import { ENV } from '@app/shared/modules/env/env.service';

async function bootstrap() {
  const app = await NestFactory.create(MediaModule);
  app.enableCors();

  const env = app.get(ENV);
  const sharedService = app.get(SharedService);

  app.connectMicroservice(sharedService.getRmqOptions(env.env.RABBITMQ_MEDIA_QUEUE));
  await app.startAllMicroservices();

  await app.listen(8000);
}
bootstrap();
