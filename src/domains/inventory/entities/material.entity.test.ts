import { describe, it, expect } from 'vitest';
import { Material, Unit } from '@domains/inventory';

describe('Material Entity', () => {
  it('should create a new material', () => {
    const material = Material.create({
      name: 'MDF 18mm',
      unit: Unit.M2,
      minStockLevel: 10,
    });

    expect(material.name).toBe('MDF 18mm');
    expect(material.unit).toBe(Unit.M2);
    expect(material.currentStock).toBe(0);
    expect(material.minStockLevel).toBe(10);
    expect(material.manualPrice).toBeNull();
  });

  it('should detect low stock', () => {
    const material = Material.create({
      name: 'Test',
      unit: Unit.ADET,
      minStockLevel: 10,
    });

    // Directly test via internal methods (simulating stock service)
    (material as any)._currentStock = 5;
    expect(material.isLowStock).toBe(true);
  });

  it('should increase stock', () => {
    const material = Material.create({
      name: 'Test',
      unit: Unit.ADET,
      minStockLevel: 10,
    });

    material.increaseStock(50);
    expect(material.currentStock).toBe(50);
  });

  it('should decrease stock', () => {
    const material = Material.create({
      name: 'Test',
      unit: Unit.ADET,
      minStockLevel: 10,
    });

    material.increaseStock(50);
    material.decreaseStock(20);
    expect(material.currentStock).toBe(30);
  });

  it('should throw when decreasing below zero', () => {
    const material = Material.create({
      name: 'Test',
      unit: Unit.ADET,
      minStockLevel: 10,
    });

    expect(() => material.decreaseStock(5)).toThrow();
  });

  it('should throw on empty name', () => {
    expect(() => Material.create({
      name: '',
      unit: Unit.ADET,
      minStockLevel: 10,
    })).toThrow('Material name cannot be empty');
  });

  it('should emit low stock warning event', () => {
    const material = Material.create({
      name: 'Test',
      unit: Unit.ADET,
      minStockLevel: 10,
    });

    material.increaseStock(15);
    material.clearEvents();
    material.decreaseStock(10);

    const lowStockEvent = material.domainEvents.find(e => e.eventName === 'LowStockWarning');
    expect(lowStockEvent).toBeDefined();
    expect((lowStockEvent as any).currentStock).toBe(5);
  });

  it('should allow manual price override', () => {
    const material = Material.create({
      name: 'Test',
      unit: Unit.ADET,
      minStockLevel: 10,
    });

    material.setManualPrice(125.5);
    expect(material.manualPrice).toBe(125.5);
  });
});
