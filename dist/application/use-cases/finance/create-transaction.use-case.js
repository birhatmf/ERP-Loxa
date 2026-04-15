"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTransaction = void 0;
const types_1 = require("@shared/types");
const finance_1 = require("@domains/finance");
/**
 * CreateTransaction Use Case
 * Handles the creation of a new financial transaction.
 */
class CreateTransaction {
    transactionRepo;
    eventBus;
    constructor(transactionRepo, eventBus) {
        this.transactionRepo = transactionRepo;
        this.eventBus = eventBus;
    }
    async execute(params) {
        const transaction = finance_1.Transaction.create({
            amount: types_1.Money.create(params.amount, params.currency),
            vatAmount: types_1.Money.create(params.vatAmount, params.currency),
            type: params.type,
            paymentMethod: params.paymentMethod,
            isInvoiced: params.isInvoiced,
            description: params.description,
            createdBy: params.createdBy,
            relatedProjectId: params.relatedProjectId,
        });
        await this.transactionRepo.save(transaction);
        await this.eventBus.publishAll(transaction.domainEvents);
        transaction.clearEvents();
        return transaction;
    }
}
exports.CreateTransaction = CreateTransaction;
//# sourceMappingURL=create-transaction.use-case.js.map