import { DataTypes, Model, Sequelize } from 'sequelize';
import { TFile } from '../../types/global/file.type';
import { removeObject } from '../../function/fileHandler';

export class FileModel extends Model implements TFile {
  public id!: string;

  public key!: string;
  public size!: number;
  public mimetype!: string;
  public url!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(): void {
    //belongsTo
    //belongsToMany
  }
}

export const createFileModel = async (sequelize: Sequelize) => {
  FileModel.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false
      },
      size: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      url: {
        type: DataTypes.STRING,
        allowNull: true
      },
      mimetype: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      modelName: 'FileModel',
      tableName: 'Files',
      timestamps: true,
      underscored: true,
      sequelize
    }
  );

  FileModel.beforeDestroy(async (file) => {
    try {
      console.log('Removing file from storage: ', file.key);
      if (file.key) {
        await removeObject(file.key);
      }
    } catch (error) {
      console.log('Error removing file from storage: ', error);
    }
  });
};
