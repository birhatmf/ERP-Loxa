import { describe, it, expect } from 'vitest';
import { Invoice, InvoiceStatus } from '@domains/invoice';
import { Money } from '@shared/types/money.vo';

describe('Invoice Entity', () => {
  it('should create a new invoice', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const invoice = Invoice.create({
      customerName: 'Ahmet Yılmaz',
      items: [
        { description: 'Mutfak Dolabı', quantity: 1, unitPrice: Money.create(10000), vatRate: 18 },
        { description: 'Montaj', quantity: 1, unitPrice: Money.create(2000), vatRate: 18 },
      ],
      dueDate: futureDate,
      createdBy: 'admin',
    });

    expect(invoice.customerName).toBe('Ahmet Yılmaz');
    expect(invoice.items).toHaveLength(2);
    expect(invoice.subtotal.amount).toBe(12000);
    expect(invoice.totalVat.amount).toBe(2160); // 12000 * 0.18
    expect(invoice.totalAmount.amount).toBe(14160);
    expect(invoice.status).toBe(InvoiceStatus.DRAFT);
    expect(invoice.invoiceNumber).toMatch(/^INV-/);
  });

  it('should send a draft invoice', () => {
    const invoice = Invoice.create({
      customerName: 'Test',
      items: [{ description: 'Test', quantity: 1, unitPrice: Money.create(1000), vatRate: 18 }],
      dueDate: new Date('2026-12-31'),
      createdBy: 'admin',
    });

    invoice.send();
    expect(invoice.status).toBe(InvoiceStatus.SENT);
  });

  it('should not send a non-draft invoice', () => {
    const invoice = Invoice.create({
      customerName: 'Test',
      items: [{ description: 'Test', quantity: 1, unitPrice: Money.create(1000), vatRate: 18 }],
      dueDate: new Date('2026-12-31'),
      createdBy: 'admin',
    });

    invoice.send();
    expect(() => invoice.send()).toThrow('Cannot send invoice');
  });

  it('should mark a sent invoice as paid', () => {
    const invoice = Invoice.create({
      customerName: 'Test',
      items: [{ description: 'Test', quantity: 1, unitPrice: Money.create(1000), vatRate: 18 }],
      dueDate: new Date('2026-12-31'),
      createdBy: 'admin',
    });

    invoice.send();
    invoice.markAsPaid();

    expect(invoice.status).toBe(InvoiceStatus.PAID);
    expect(invoice.paidDate).toBeDefined();
  });

  it('should not pay a draft invoice', () => {
    const invoice = Invoice.create({
      customerName: 'Test',
      items: [{ description: 'Test', quantity: 1, unitPrice: Money.create(1000), vatRate: 18 }],
      dueDate: new Date('2026-12-31'),
      createdBy: 'admin',
    });

    expect(() => invoice.markAsPaid()).toThrow('Cannot mark invoice as paid');
  });

  it('should cancel a non-paid invoice', () => {
    const invoice = Invoice.create({
      customerName: 'Test',
      items: [{ description: 'Test', quantity: 1, unitPrice: Money.create(1000), vatRate: 18 }],
      dueDate: new Date('2026-12-31'),
      createdBy: 'admin',
    });

    invoice.cancel();
    expect(invoice.status).toBe(InvoiceStatus.CANCELLED);
  });

  it('should not cancel a paid invoice', () => {
    const invoice = Invoice.create({
      customerName: 'Test',
      items: [{ description: 'Test', quantity: 1, unitPrice: Money.create(1000), vatRate: 18 }],
      dueDate: new Date('2026-12-31'),
      createdBy: 'admin',
    });

    invoice.send();
    invoice.markAsPaid();

    expect(() => invoice.cancel()).toThrow('Cannot cancel a paid invoice');
  });

  it('should require at least one item', () => {
    expect(() => Invoice.create({
      customerName: 'Test',
      items: [],
      dueDate: new Date('2026-12-31'),
      createdBy: 'admin',
    })).toThrow('Invoice must have at least one item');
  });

  it('should calculate VAT correctly for different rates', () => {
    const invoice = Invoice.create({
      customerName: 'Test',
      items: [
        { description: 'Item 1', quantity: 1, unitPrice: Money.create(1000), vatRate: 18 },
        { description: 'Item 2', quantity: 2, unitPrice: Money.create(500), vatRate: 8 },
      ],
      dueDate: new Date('2026-12-31'),
      createdBy: 'admin',
    });

    expect(invoice.items[0].vatAmount.amount).toBe(180); // 1000 * 0.18
    expect(invoice.items[1].vatAmount.amount).toBe(80);  // 1000 * 0.08
    expect(invoice.totalVat.amount).toBe(260);
  });
});
