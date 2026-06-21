import { SalesTransactionController } from '../../../controller/sales/sales-transaction.controller';
import {
  TCreateSalesTransaction,
  TGetSalesTransactions
} from '../../../types/sales/sales-transaction.type';
import { wrapList, wrapOne, wrapVoid } from '../../../utils';

export default {
  Query: {
    salesTransactions: wrapList(
      'salesTransactions',
      (doc: TGetSalesTransactions) => SalesTransactionController.list(doc)
    ),
    salesTransaction: wrapOne('salesTransaction', ({ id }: { id: string }) =>
      SalesTransactionController.getById(id)
    )
  },
  Mutation: {
    createSalesTransaction: wrapOne(
      'salesTransaction',
      (doc: TCreateSalesTransaction, ctx) =>
        SalesTransactionController.create(doc, ctx),
      'Sales transaction created'
    ),
    markSalesTransactionPaid: wrapOne(
      'salesTransaction',
      ({ id }: { id: string }) => SalesTransactionController.markPaid(id),
      'Sales transaction marked paid'
    ),
    addSalesInstallment: wrapOne(
      'installment',
      (
        doc: {
          salesTransactionId: string;
          amountMnt: number;
          paidAt?: Date | null;
          notes?: string | null;
        },
        ctx
      ) => SalesTransactionController.addInstallment(doc, ctx),
      'Хэсэгчилсэн төлбөр бүртгэгдлээ'
    ),
    removeSalesInstallment: wrapVoid('Устгагдлаа', ({ id }: { id: string }) =>
      SalesTransactionController.removeInstallment(id)
    )
  }
};
