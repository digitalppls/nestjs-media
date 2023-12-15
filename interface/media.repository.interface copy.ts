import { BaseInterfaceRepository } from '@app/shared';
import { MediaEntity } from './media.entity';

export interface MediaRepositoryInterface
  extends BaseInterfaceRepository<MediaEntity> { }
