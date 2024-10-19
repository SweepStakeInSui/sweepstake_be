import { BaseStorage } from './base.storage';

export class DiskStorage implements BaseStorage {
    upload(file: Express.Multer.File): Promise<string> {
        console.log(file);
        throw new Error('Method not implemented.');
    }
    delete(file: string): Promise<void> {
        console.log(file);
        throw new Error('Method not implemented.');
    }
    getUrl(file: string): string {
        console.log(file);
        throw new Error('Method not implemented.');
    }
}
