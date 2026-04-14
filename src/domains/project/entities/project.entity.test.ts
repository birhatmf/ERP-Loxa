import { describe, it, expect } from 'vitest';
import { Project, ProjectStatus } from '@domains/project';
import { Money } from '@shared/types/money.vo';

describe('Project Entity', () => {
  it('should create a new project', () => {
    const project = Project.create({
      name: 'Ahmet Bey Mutfak',
      customerName: 'Ahmet Yılmaz',
      totalPrice: Money.create(15000),
    });

    expect(project.name).toBe('Ahmet Bey Mutfak');
    expect(project.customerName).toBe('Ahmet Yılmaz');
    expect(project.status).toBe(ProjectStatus.DRAFT);
    expect(project.totalPrice.amount).toBe(15000);
    expect(project.itemCount).toBe(0);
  });

  it('should add item to project', () => {
    const project = Project.create({
      name: 'Test',
      customerName: 'Test Customer',
      totalPrice: Money.create(10000),
    });

    const item = project.addItem({
      materialId: 'mat-1',
      quantity: 10,
      unitPrice: Money.create(200),
    });

    expect(project.itemCount).toBe(1);
    expect(item.totalPrice.amount).toBe(2000);
    expect(project.totalCost.amount).toBe(2000);
  });

  it('should calculate profit margin', () => {
    const project = Project.create({
      name: 'Test',
      customerName: 'Test Customer',
      totalPrice: Money.create(10000),
    });

    project.addItem({
      materialId: 'mat-1',
      quantity: 10,
      unitPrice: Money.create(200),
    });

    expect(project.profitMargin.amount).toBe(8000); // 10000 - 2000
  });

  it('should transition status correctly', () => {
    const project = Project.create({
      name: 'Test',
      customerName: 'Test Customer',
      totalPrice: Money.create(10000),
    });

    project.updateStatus(ProjectStatus.ACTIVE);
    expect(project.status).toBe(ProjectStatus.ACTIVE);

    project.updateStatus(ProjectStatus.IN_PROGRESS);
    expect(project.status).toBe(ProjectStatus.IN_PROGRESS);

    project.updateStatus(ProjectStatus.COMPLETED);
    expect(project.status).toBe(ProjectStatus.COMPLETED);
    expect(project.endDate).toBeDefined();
  });

  it('should reject invalid status transitions', () => {
    const project = Project.create({
      name: 'Test',
      customerName: 'Test Customer',
      totalPrice: Money.create(10000),
    });

    // draft → completed is invalid
    expect(() => project.updateStatus(ProjectStatus.COMPLETED))
      .toThrow('Invalid status transition');
  });

  it('should not add items to completed project', () => {
    const project = Project.create({
      name: 'Test',
      customerName: 'Test Customer',
      totalPrice: Money.create(10000),
    });

    project.updateStatus(ProjectStatus.ACTIVE);
    project.updateStatus(ProjectStatus.IN_PROGRESS);
    project.updateStatus(ProjectStatus.COMPLETED);

    expect(() => project.addItem({
      materialId: 'mat-1',
      quantity: 10,
      unitPrice: Money.create(200),
    })).toThrow('Cannot add items to a completed project');
  });

  it('should emit domain events', () => {
    const project = Project.create({
      name: 'Test',
      customerName: 'Test Customer',
      totalPrice: Money.create(10000),
    });

    expect(project.domainEvents.length).toBeGreaterThan(0);
    expect(project.domainEvents[0].eventName).toBe('ProjectCreated');
  });
});
