import { Body, Controller, Delete, Get, Header, HttpException, HttpStatus, Inject, Param, Post, Request, StreamableFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { UPLOAD_FOLDER, MediaService } from './media.service';
import * as fs from "fs";
import { UploadDto } from './dtos/upload.dto';
import { Public } from '@app/shared/guards/public.guard';
import { AuthGuard } from '@app/shared';
import { File } from './interface/file.type';
import { RateLimiterGuard } from '@app/shared/guards/rateLimiter.guard';
import { MediaImagesSizes } from './interface/media-images-sizes.enum';
import { MediaAlbums } from './interface/media-albums.enum';
import { UserRequest } from '@app/user';
import { MediaEntity } from './interface/media.entity';




const imageFilter = (req: Request, file: File, callback: (error: Error, acceptFile: boolean) => void) => {
    // if (!Boolean(file.mimetype.match(/(jpg|jpeg|png|gif|mov|quicktime|3gp|avi|mpeg|mp4)/))) callback(null, false);
    if (!Boolean(file.mimetype.match(/(jpg|jpeg|png|gif)/))) callback(null, false);

    callback(null, true);
}

const MAX_UPLOAD_SIZE_40_MB = 1024 * 1024 * 10 * 4;
const MAX_UPLOAD_FILES = 10;
const MAX_FILES_PER_ACCOUNT = 100;


const imageOptions: MulterOptions = {
    limits: { fileSize: MAX_UPLOAD_SIZE_40_MB, files: MAX_UPLOAD_FILES },
    fileFilter: imageFilter
}

export class MediaParams {
    types: string[];
    maxUploadSize: number;
    maxUploadFiles: number;
    maxFilesPerAccount: number;
    sizes: number[]
}

@ApiTags("Media")
@Controller('media')
export class MediaController {

    constructor(
        // @Inject('MEDIA_SERVICE') private readonly mediaSerivce: ClientProxy,
        private readonly service: MediaService
    ) {

    }

    @Get("params")
    @ApiOperation({ summary: "Параметры загрузки файлов" })
    @ApiResponse({ type: MediaParams })
    getUploadParams() {
        return {
            types: "jpg|jpeg|png|gif".split("|"),
            maxUploadSize: MAX_UPLOAD_SIZE_40_MB,
            maxUploadFiles: MAX_UPLOAD_FILES,
            maxFilesPerAccount: MAX_FILES_PER_ACCOUNT,
            sizes: Object.values(MediaImagesSizes)
        }
    }

    @Public()
    @Get("image/:id/:size")
    @Header('content-type', 'image/webp')
    @Header("200", "Partial Content")
    @ApiOperation({ summary: "Получить контент фотографии по id и размеру" })
    @ApiParam({ name: "id" })
    @ApiParam({ name: "size", enum: MediaImagesSizes })
    @ApiResponse({ type: StreamableFile, description: "return as ByteCode streamable..." })
    async image(@Param("id") id: number, @Param("size") size: number) {
        var stream = fs.createReadStream(await this.service.getImageFilePath(id, size));
        return new StreamableFile(stream)
    }



    @Get("album/:album_name")
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiResponse({ type: [MediaEntity] })
    @ApiOperation({ summary: "Получить альбом по его id" })
    @ApiParam({ name: "album_name", enum: Object.values(MediaAlbums) })
    async album(@Request() req: UserRequest, @Param("album_name") albumName: MediaAlbums) {
        return this.service.getUserAlbum(req.user.id, albumName as MediaAlbums)
    }




    @Delete(":id")
    @ApiParam({ name: "id" })
    @ApiOperation({ summary: "Удалить фото" })
    @ApiResponse({ type: MediaEntity, description: "Возвращается удаленное фото" })
    async delete(@Request() req: UserRequest, @Param("id") id: number): Promise<MediaEntity> {
        console.log("req.user.id)", req.user.id)
        return this.service.delete(req.user.id, id);
    }


    // @Throttle(1, 2)
    @ApiConsumes("multipart/form-data")
    @ApiBody({ type: UploadDto })
    @ApiOperation({ summary: "Загрузка фотографий" })
    @ApiResponse({ type: [MediaEntity] })
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FilesInterceptor('files', MAX_UPLOAD_FILES, imageOptions), RateLimiterGuard)
    @Post()
    async upload(@Request() request: UserRequest, @UploadedFiles() files: File[], @Body() _dto: UploadDto) {
        if ((await this.service.countOfUser(request.user.id)) >= MAX_FILES_PER_ACCOUNT) {
            throw new HttpException("Content limit exceeded", HttpStatus.BAD_REQUEST);
        }

        for (let file of files) {
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        }

        let dto: { userId: number, album: MediaAlbums, names: string[], descriptions: string[] } = {
            userId: request.user.id,
            names: files.map(x => x.originalname.split('.')[0] + ''),
            descriptions: files.map(x => ''),
            album: _dto.album
        };
        try {
            if (_dto?.params) {
                const obj = JSON.parse(_dto.params);
                if (obj?.names) for (let i = 0; i < obj?.names?.length; i++) {
                    dto.names[i] = obj.names[i]
                }
                if (obj?.descriptions) for (let i = 0; i < obj?.descriptions?.length; i++) {
                    dto.descriptions[i] = obj.descriptions[i]
                }
            }
        } catch (err) {
            console.log(err)
        }


        return this.service.upload(files, dto);
    }


    // @Public()
    // @ApiOperation({ summary: "Получение видео контента" })
    // @Get("video/:id/:format")
    // @ApiParam({ name: "id" })
    // @ApiParam({ name: "format", enum: ['player', 'iframe', 'thumbnail', 'mp4'] })
    // async player(@Param("id") id: string, @Param("format") format: 'player' | 'iframe' | 'thumbnail' | 'mp4') {
    //     if (!Types.ObjectId.isValid(id)) throw new HttpException("Incorrect id", HttpStatus.BAD_REQUEST);
    //     const content = await this.service.get(new Types.ObjectId(id));
    //     if (!content.remoteId) throw new HttpException("Incorrect file", HttpStatus.BAD_REQUEST);
    //     if (content.service === "api.video") {
    //         switch (format) {
    //             case "player": return `https://embed.api.video/vod/${content.remoteId}`;
    //             case "mp4": return `https://vod.api.video/vod/${content.remoteId}/mp4/source.mp4`;
    //             case "iframe": return `<iframe src="https://embed.api.video/vod/${content.remoteId}" width="100%" height="100%" frameborder="0" scrolling="no" allowfullscreen="true"></iframe>`;
    //             case "thumbnail": return `https://vod.api.video/vod/${content.remoteId}/thumbnail.jpg`;
    //         }

    //     }
    // }


}
