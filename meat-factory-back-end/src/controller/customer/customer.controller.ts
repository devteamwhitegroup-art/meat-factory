import { Op, WhereOptions } from 'sequelize';
import { CustomerModel } from '../../models/customer/customer.model';
import { SalesTransactionModel } from '../../models/sales/sales-transaction.model';
import { ShipmentModel } from '../../models/shipment/shipment.model';
import {
  CUSTOMER_KIND,
  TCreateCustomer,
  TCustomer,
  TGetCustomers,
  TUpdateCustomer
} from '../../types/customer/customer.type';
import { TPaginationGeneric } from '../../types/global/global.type';
import { pagination } from '../../utils';

export class CustomerController {
  static async findIdCheck(id: string): Promise<CustomerModel> {
    const customer = await CustomerModel.findByPk(id);
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  private static async _assertUniqueRegistrationNumber(
    registrationNumber: string,
    excludeId?: string
  ): Promise<void> {
    const where: WhereOptions = { registrationNumber };
    if (excludeId) Object.assign(where, { id: { [Op.ne]: excludeId } });
    const existing = await CustomerModel.findOne({ where });
    if (existing)
      throw new Error('Customer registration number already exists');
  }

  static async create(doc: TCreateCustomer): Promise<TCustomer> {
    if (!doc.name || !doc.name.trim())
      throw new Error('Customer name is required');
    if (doc.registrationNumber && doc.registrationNumber.trim())
      await this._assertUniqueRegistrationNumber(
        doc.registrationNumber.trim()
      );

    return await CustomerModel.create({
      name: doc.name.trim(),
      kind: doc.kind ?? CUSTOMER_KIND.BROKER,
      contactPhone: doc.contactPhone ?? null,
      address: doc.address ?? null,
      bankAccount: doc.bankAccount ?? null,
      registrationNumber: doc.registrationNumber ?? null,
      taxId: doc.taxId ?? null,
      isActive: true
    });
  }

  static async list(
    doc: TGetCustomers
  ): Promise<TPaginationGeneric<TCustomer>> {
    const { offset, limit } = pagination(doc);
    const where: WhereOptions = {};
    if (typeof doc.isActive === 'boolean')
      Object.assign(where, { isActive: doc.isActive });
    if (doc.kind) Object.assign(where, { kind: doc.kind });
    if (doc.search && doc.search.trim())
      Object.assign(where, {
        name: { [Op.iLike]: `%${doc.search.trim()}%` }
      });

    return await CustomerModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
  }

  static async getById(id: string): Promise<CustomerModel> {
    const customer = await CustomerModel.findByPk(id, {
      include: [
        { model: SalesTransactionModel, as: 'salesTransactions' },
        { model: ShipmentModel, as: 'shipments' }
      ]
    });
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  static async update(doc: TUpdateCustomer): Promise<CustomerModel> {
    const customer = await this.findIdCheck(doc.id);

    if (
      doc.registrationNumber !== undefined &&
      doc.registrationNumber &&
      doc.registrationNumber.trim() &&
      doc.registrationNumber.trim() !== customer.registrationNumber
    ) {
      await this._assertUniqueRegistrationNumber(
        doc.registrationNumber.trim(),
        customer.id
      );
    }

    if (doc.name !== undefined) customer.name = doc.name.trim();
    if (doc.kind !== undefined) customer.kind = doc.kind;
    if (doc.contactPhone !== undefined)
      customer.contactPhone = doc.contactPhone ?? null;
    if (doc.address !== undefined) customer.address = doc.address ?? null;
    if (doc.bankAccount !== undefined)
      customer.bankAccount = doc.bankAccount ?? null;
    if (doc.registrationNumber !== undefined)
      customer.registrationNumber = doc.registrationNumber ?? null;
    if (doc.taxId !== undefined) customer.taxId = doc.taxId ?? null;
    if (typeof doc.isActive === 'boolean') customer.isActive = doc.isActive;

    return await customer.save();
  }

  static async remove(id: string): Promise<void> {
    const customer = await this.findIdCheck(id);
    const txCount = await SalesTransactionModel.count({
      where: { customerId: id }
    });
    const shipCount = await ShipmentModel.count({
      where: { customerId: id }
    });
    if (txCount > 0 || shipCount > 0)
      throw new Error(
        'Customer has linked transactions/shipments; deactivate instead'
      );
    await customer.destroy();
  }
}
