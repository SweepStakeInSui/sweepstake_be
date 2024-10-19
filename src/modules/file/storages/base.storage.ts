export interface BaseStorage {
    upload(file: Express.Multer.File): Promise<string>;
    delete(file: string): Promise<void>;
    getUrl(file: string): string;
}
