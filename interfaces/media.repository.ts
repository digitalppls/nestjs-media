import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseAbstractRepository } from '@app/shared';
import { MediaEntity } from './media.entity';
import { MediaRepositoryInterface } from './media.repository.interface copy';

@Injectable()
export class MediaRepository
  extends BaseAbstractRepository<MediaEntity>
  implements MediaRepositoryInterface {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly MediaRepository: Repository<MediaEntity>,
  ) {
    super(MediaRepository);
  }
}
