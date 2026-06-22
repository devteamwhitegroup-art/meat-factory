import { FileModel } from "../../models/global/file.model";
import { TCreateFile, TFile } from "../../types/global/file.type";
import { Model } from "sequelize";
import { findOrThrow } from "../../utils";

export class FileController {
  static findIdCheck(id: string) {
    return findOrThrow(FileModel, id, "File олдсонгүй");
  }

  static async createFile(doc: TCreateFile): Promise<TFile & Model> {
    const [file] = await FileModel.findOrCreate({
      where: doc,
      defaults: doc,
    });
    return file;
  }

  static async deleteFile(id: string): Promise<void> {
    const file = await this.findIdCheck(id);
    await file.destroy();
  }
}
