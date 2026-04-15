"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayCheck = exports.CreateCheck = void 0;
const types_1 = require("@shared/types");
const payment_1 = require("@domains/payment");
const finance_1 = require("@domains/finance");
/**
 * CreateCheck Use Case
 * Creates a new check/deferred payment.
 */
class CreateCheck {
    checkRepo;
    eventBus;
    constructor(checkRepo, eventBus) {
        this.checkRepo = checkRepo;
        this.eventBus = eventBus;
    }
    async execute(params) {
        const check = payment_1.Check.create({
            type: params.type,
            amount: types_1.Money.create(params.amount, params.currency),
            dueDate: params.dueDate,
            ownerName: params.ownerName,
            checkNumber: params.checkNumber,
            bankName: params.bankName,
            description: params.description,
            relatedProjectId: params.relatedProjectId,
        });
        await this.checkRepo.save(check);
        await this.eventBus.publishAll(check.domainEvents);
        check.clearEvents();
        return check;
    }
}
exports.CreateCheck = CreateCheck;
/**
 * PayCheck Use Case
 * Marks a check as paid and creates the corresponding Transaction.
 *
 * This is a cross-domain use case:
 * Payment domain → creates event → Finance domain creates Transaction
 */
class PayCheck {
    checkRepo;
    transactionRepo;
    eventBus;
    constructor(checkRepo, transactionRepo, eventBus) {
        this.checkRepo = checkRepo;
        this.transactionRepo = transactionRepo;
        this.eventBus = eventBus;
    }
    async execute(params) {
        const check = await this.checkRepo.findById(params.checkId);
        if (!check) {
            throw new Error(`Check not found: ${params.checkId}`);
        }
        // 1. Mark check as paid (triggers CheckPaidEvent)
        check.markAsPaid(params.paidDate);
        // 2. Create corresponding transaction
        const transactionType = check.type === payment_1.CheckType.RECEIVED
            ? finance_1.TransactionType.INCOME
            : finance_1.TransactionType.EXPENSE;
        const transaction = finance_1.Transaction.create({
            amount: check.amount,
            vatAmount: types_1.Money.zero(check.amount.currency),
            type: transactionType,
            paymentMethod: finance_1.PaymentMethod.TRANSFER,
            isInvoiced: false,
            description: `Check payment: ${check.ownerName} - ${check.description}`,
            createdBy: params.createdBy,
            relatedProjectId: check.relatedProjectId,
        });
        // 3. Persist both
        await this.checkRepo.save(check);
        await this.transactionRepo.save(transaction);
        // 4. Publish events
        await this.eventBus.publishAll(check.domainEvents);
        await this.eventBus.publishAll(transaction.domainEvents);
        check.clearEvents();
        transaction.clearEvents();
        return { check, transaction };
    }
}
exports.PayCheck = PayCheck;
//# sourceMappingURL=payment.use-cases.js.map