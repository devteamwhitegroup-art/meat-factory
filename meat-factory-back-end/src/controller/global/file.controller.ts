import { FileModel } from '../../models/global/file.model';
import { TCreateFile, TFile } from '../../types/global/file.type';
import { Model } from 'sequelize';

export class FileController {
  static async findIdCheck(id: string) {
    const file = await FileModel.findByPk(id);
    if (!file) {
      throw new Error('File олдсонгүй');
    }
    return file;
  }

  static async createFile(doc: TCreateFile): Promise<TFile & Model> {
    const [file] = await FileModel.findOrCreate({
      where: doc,
      defaults: doc
    });
    return file;
  }

  static async deleteFile(id: string): Promise<void> {
    const file = await this.findIdCheck(id);
    await file.destroy();
  }
}
