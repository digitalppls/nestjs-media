import { MediaAlbums } from "apps/api/src/media/interface/media-albums.enum";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { File } from "buffer";


export class UploadDto {
    @ApiProperty({ format: "binary", type: [String] })
    files: File[];

    @ApiProperty({ description: "names and descriptions", type: String, example: '{"names":["a1","a2"],"descriptions":["desc1","desc2"]}' })
    params?: string;

    @ApiProperty({ enum: MediaAlbums, default: MediaAlbums.PROFILE_PHOTOS })
    album: MediaAlbums
}