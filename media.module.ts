import { Module } from '@nestjs/common';
import { SharedModule, RedisModule, PostgresDBModule } from '@app/shared';
import { MediaService } from './media.service';
import { MediaRepository } from 'apps/api/src/media/interface/media.repository';
import { MediaController } from './media.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaEntity } from 'apps/api/src/media/interface/media.entity';

@Module({
  imports: [
    RedisModule,
    PostgresDBModule,
    TypeOrmModule.forFeature([
      MediaEntity,
    ]),
    SharedModule.registerRmq('USER_SERVICE', process.env.RABBITMQ_USER_QUEUE),
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    {
      provide: 'MediaRepositoryInterface',
      useClass: MediaRepository,
    },
  ],
})
export class MediaModule { }
