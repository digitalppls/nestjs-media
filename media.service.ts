import { MediaEntity } from 'apps/api/src/media/interface/media.entity';
import { MediaRepositoryInterface } from 'apps/api/src/media/interface/media.repository.interface copy';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
// import { RpcException } from '@nestjs/microservices';
import * as fs from "fs";
import * as path from "path";
import * as sharp from 'sharp';
import { File } from 'apps/api/src/media/interface/file.type';
import { MediaImagesSizes } from 'apps/api/src/media/interface/media-images-sizes.enum';
import { MediaAlbums } from 'apps/api/src/media/interface/media-albums.enum';
const homedir = require("os").homedir()

const IMAGE_SIZES = [
    { w: MediaImagesSizes.large, h: MediaImagesSizes.large, q: 98 },
    { w: MediaImagesSizes.medium, h: MediaImagesSizes.medium, q: 98 },
    { w: MediaImagesSizes.small, h: MediaImagesSizes.small, q: 98 }
];

// const homedir = require('os').homedir();
export const UPLOAD_FOLDER = path.join(homedir, "MediaFiles");

@Injectable()
export class MediaService {


    constructor(
        @Inject('MediaRepositoryInterface') private readonly mediaRepository: MediaRepositoryInterface,

    ) {
        const dir = path.join(UPLOAD_FOLDER);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            setTimeout(() => {
                Logger.log(`folder ${dir} created`, "Media")
            }, 1000)
        }
    }


    private getImageFilesPathes(media: MediaEntity): string[] {
        const date = new Date(media.timestamp * 1000);
        return IMAGE_SIZES.map(imgSize => path.join(UPLOAD_FOLDER, media.extention, date.getFullYear() + '', date.getMonth() + '', date.getDate() + '', media.id + '', imgSize.w + "." + media.extention))
    }

    public async getImageFilePath(id: number, size: number): Promise<string> {
        const media = await this.mediaRepository.findOneById(id);
        if (!media) throw new NotFoundException("Media not found");
        const date = new Date(media.timestamp * 1000);
        return path.join(UPLOAD_FOLDER, media.extention, date.getFullYear() + '', date.getMonth() + '', date.getDate() + '', media.id + '', size + "." + media.extention)
    }

    private getImageFileFolder(media: MediaEntity): string {
        const date = new Date(media.timestamp * 1000);
        return path.join(UPLOAD_FOLDER, media.extention, date.getFullYear() + '', date.getMonth() + '', date.getDate() + '', media.id + '')
    }

    private async deleteFileFromDisk(media: MediaEntity) {
        try {
            fs.rm(this.getImageFileFolder(media), { recursive: true, force: true, maxRetries: 2 }, (err) => {
                if (err) console.log("err", err?.message)
            });
        } catch (err) {
            console.log(err?.message)
        }
    }


    private async saveFileToDisk(buffer: Buffer, media: MediaEntity) {
        const paths = this.getImageFilesPathes(media);
        await new Promise(r => fs.mkdir(this.getImageFileFolder(media), { recursive: true }, r));
        await Promise.all(IMAGE_SIZES
            .map((size, i) =>
                sharp(buffer).resize(size.w, size.h, { fit: 'inside' }).webp({ effort: 3, quality: size.q }).toFile(paths[i])
            )
        )
    }


    public async delete(userId: number, id: number): Promise<MediaEntity> {
        const media = await this.mediaRepository.findOneByCondition({ where: { userId, id } });
        if (!media) throw new NotFoundException("Media not found");

        const deleted = await this.mediaRepository.remove({ id, userId });
        this.deleteFileFromDisk(deleted);
        return media;
    }



    public async upload(files: File[], dto: { userId: number, names?: string[], descriptions?: string[], album: MediaAlbums }): Promise<MediaEntity[]> {
        const result: MediaEntity[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            const isImage = file.mimetype.indexOf('image') > -1;
            const isVideo = file.mimetype.indexOf('video') > -1 || file.mimetype.indexOf('mov') > -1;

            if (!isImage) {
                console.error(file.mimetype, "is not image!");
                continue;
            };

            const timestamp = Math.floor(new Date().getTime() / 1000);
            const media: MediaEntity = await this.mediaRepository.save({ extention: "webp", album: dto.album, timestamp, userId: dto.userId })
            console.log("saved to db", media);
            if (media) await this.saveFileToDisk(file.buffer, media);
            result.push(media);

            const name = dto?.names[i] || "";
            const description = dto?.descriptions[i] || '';
        }

        return result;
    }


    public async countOfUser(userId: number): Promise<number> {
        return this.mediaRepository.count({ where: { userId } })
    }

    async get(id: number): Promise<MediaEntity> {
        return this.mediaRepository.findOneById(id);
    }

    async getUserAlbum(userId: number, album: MediaAlbums) {
        return this.mediaRepository.findAll({ where: { userId, album } });
    }

}
