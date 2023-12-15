import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { MediaAlbums } from './media-albums.enum';



/**
 * Structure for store on disk
 * 
 * /{extention}/{year}/{month}/{date}/{userId}/{id}/{size}.{extention}
 * /png/2023/11/30/1/16/256.png
 * 
 */

@Entity('media')
export class MediaEntity {

  @IsInt()
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int4" })
  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number, description: "Timestamp of uploading date" })
  timestamp?: number;

  @Column({ type: "varchar", length: 10 })
  @IsOptional()
  @Transform((param) => param.value.toLowerCase())
  @ApiProperty({ type: String, description: "User id" })
  extention?: string;

  @Index()
  @Column({ type: "varchar", length: 30, nullable: true })
  @ApiProperty({ type: String, description: "album", enum: MediaAlbums })
  album?: MediaAlbums;

  @Column({ type: "int8" })
  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number, description: "User id" })
  userId?: number;

}
