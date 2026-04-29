"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayrollRoutes = createPayrollRoutes;
const express_1 = require("express");
const logger_1 = require("../../../shared/logger");
function normalizePeriod(value) {
    const period = String(value ?? '').trim();
    if (!/^\d{4}-\d{2}$/.test(period)) {
        throw new Error('Period must be in YYYY-MM format');
    }
    return period;
}
function periodFromDate(date) {
    return date.toISOString().slice(0, 7);
}
function toAmount(value, label) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`${label} must be a positive number`);
    }
    return amount;
}
function createPayrollRoutes(payrollRepo) {
    const router = (0, express_1.Router)();
    router.get('/workers', async (_req, res) => {
        try {
            res.json(await payrollRepo.findWorkers());
        }
        catch (error) {
            logger_1.logger.error('Failed to list workers', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    router.post('/workers', async (req, res) => {
        try {
            const name = String(req.body.name ?? '').trim();
            if (!name)
                return res.status(400).json({ error: 'Worker name is required' });
            const worker = await payrollRepo.saveWorker({
                name,
                monthlySalary: toAmount(req.body.monthlySalary ?? 0, 'Monthly salary'),
            });
            logger_1.logger.info('Worker created', { id: worker.id, name: worker.name });
            res.status(201).json(worker);
        }
        catch (error) {
            logger_1.logger.error('Failed to create worker', { error: error.message, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    router.patch('/workers/:id', async (req, res) => {
        try {
            const current = await payrollRepo.findWorkerById(req.params.id);
            if (!current)
                return res.status(404).json({ error: 'Worker not found' });
            const name = req.body.name !== undefined ? String(req.body.name).trim() : current.name;
            if (!name)
                return res.status(400).json({ error: 'Worker name is required' });
            const worker = await payrollRepo.saveWorker({
                id: current.id,
                name,
                monthlySalary: req.body.monthlySalary !== undefined
                    ? toAmount(req.body.monthlySalary, 'Monthly salary')
                    : current.monthlySalary,
                isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : current.isActive,
            });
            res.json(worker);
        }
        catch (error) {
            logger_1.logger.error('Failed to update worker', { error: error.message, id: req.params.id, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    router.patch('/workers/:id/status', async (req, res) => {
        try {
            const current = await payrollRepo.findWorkerById(req.params.id);
            if (!current)
                return res.status(404).json({ error: 'Worker not found' });
            await payrollRepo.setWorkerActive(req.params.id, Boolean(req.body.isActive));
            res.json(await payrollRepo.findWorkerById(req.params.id));
        }
        catch (error) {
            logger_1.logger.error('Failed to update worker status', { error: error.message, id: req.params.id });
            res.status(400).json({ error: error.message });
        }
    });
    router.put('/workers/:id/months/:period', async (req, res) => {
        try {
            const worker = await payrollRepo.findWorkerById(req.params.id);
            if (!worker)
                return res.status(404).json({ error: 'Worker not found' });
            const period = normalizePeriod(req.params.period);
            const salary = toAmount(req.body.salary, 'Salary');
            res.json(await payrollRepo.upsertSalaryMonth(worker.id, period, salary));
        }
        catch (error) {
            logger_1.logger.error('Failed to set worker salary month', { error: error.message, id: req.params.id, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    router.post('/workers/:id/advances', async (req, res) => {
        try {
            const worker = await payrollRepo.findWorkerById(req.params.id);
            if (!worker)
                return res.status(404).json({ error: 'Worker not found' });
            const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();
            if (Number.isNaN(paidAt.getTime()))
                return res.status(400).json({ error: 'Paid date is invalid' });
            const advance = await payrollRepo.addAdvance({
                workerId: worker.id,
                period: req.body.period ? normalizePeriod(req.body.period) : periodFromDate(paidAt),
                amount: toAmount(req.body.amount, 'Advance amount'),
                paidAt,
                note: String(req.body.note ?? ''),
            });
            logger_1.logger.info('Worker advance created', { id: advance.id, workerId: worker.id, amount: advance.amount });
            res.status(201).json(advance);
        }
        catch (error) {
            logger_1.logger.error('Failed to create worker advance', { error: error.message, id: req.params.id, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    router.delete('/advances/:id', async (req, res) => {
        try {
            await payrollRepo.deleteAdvance(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Failed to delete worker advance', { error: error.message, id: req.params.id });
            res.status(400).json({ error: error.message });
        }
    });
    router.get('/summary', async (req, res) => {
        try {
            const period = normalizePeriod(req.query.period ?? new Date().toISOString().slice(0, 7));
            const [workers, salaryMonths, advances] = await Promise.all([
                payrollRepo.findWorkers(),
                payrollRepo.findSalaryMonths(period),
                payrollRepo.findAdvancesByPeriod(period),
            ]);
            const salaryByWorker = new Map(salaryMonths.map(item => [item.workerId, item.salary]));
            const advancesByWorker = new Map();
            for (const advance of advances) {
                const list = advancesByWorker.get(advance.workerId) ?? [];
                list.push(advance);
                advancesByWorker.set(advance.workerId, list);
            }
            const rows = workers.map(worker => {
                const workerAdvances = advancesByWorker.get(worker.id) ?? [];
                const salary = salaryByWorker.get(worker.id) ?? worker.monthlySalary;
                const advanceTotal = workerAdvances.reduce((sum, advance) => sum + advance.amount, 0);
                return {
                    worker,
                    period,
                    salary,
                    advanceTotal,
                    remainingSalary: salary - advanceTotal,
                    advances: workerAdvances,
                };
            });
            res.json({
                period,
                rows,
                totals: {
                    salary: rows.reduce((sum, row) => sum + row.salary, 0),
                    advances: rows.reduce((sum, row) => sum + row.advanceTotal, 0),
                    remaining: rows.reduce((sum, row) => sum + row.remainingSalary, 0),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to build payroll summary', { error: error.message, period: req.query.period });
            res.status(400).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=payroll.routes.js.map