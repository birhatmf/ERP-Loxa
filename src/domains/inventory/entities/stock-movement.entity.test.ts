import { describe, expect, it } from 'vitest';
import { StockMovement, StockMovementType } from '@domains/inventory';

describe('StockMovement Entity', () => {
  it('marks corrected movements and updates details', () => {
    const movement = StockMovement.create({
      materialId: 'mat-1',
      type: StockMovementType.IN,
      quantity: 10,
      description: 'Initial stock',
    });

    movement.markAsCorrection('Düzeltme');
    movement.updateDetails({
      quantity: 12,
      description: 'Corrected stock entry',
    });

    expect(movement.isCorrection).toBe(true);
    expect(movement.correctionReason).toBe('Düzeltme');
    expect(movement.quantity).toBe(12);
    expect(movement.description).toBe('Corrected stock entry');
  });
});
