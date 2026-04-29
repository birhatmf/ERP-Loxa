"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentRoutes = createPaymentRoutes;
const express_1 = __importStar(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const payment_1 = require("../../../domains/payment");
const types_1 = require("../../../shared/types");
const logger_1 = require("../../../shared/logger");
const file_1 = require("../../../shared/utils/file");
function getCheckFilesDir() {
    const dir = path_1.default.join(process.cwd(), 'data', 'check-files');
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    return dir;
}
function mapCheck(check, fileCount = 0) {
    return {
        id: check.id,
        type: check.type,
        amount: check.amount.amount,
        dueDate: check.dueDate,
        ownerName: check.ownerName,
        checkNumber: check.checkNumber ?? '',
        bankName: check.bankName ?? '',
        description: check.description ?? '',
        status: check.status,
        paidDate: check.paidDate ?? null,
        relatedProjectId: check.relatedProjectId ?? null,
        createdAt: check.createdAt,
        updatedAt: check.updatedAt,
        fileCount,
    };
}
function mapFile(checkId, file) {
    return {
        id: file.id,
        name: file.originalName,
        size: file.size,
        type: file.mimeType,
        url: `/api/payment/checks/${checkId}/files/${file.id}`,
        uploadedAt: file.uploadedAt.toISOString(),
    };
}
function createPaymentRoutes(createCheck, payCheck, checkRepo, checkFileRepo, transactionRepo, eventBus) {
    const router = (0, express_1.Router)();
    const uploadParser = express_1.default.raw({ type: 'multipart/form-data', limit: '10mb' });
    router.get('/checks', async (req, res) => {
        try {
            const checks = await checkRepo.findAll();
            const fileCounts = await Promise.all(checks.map(async (check) => ({
                checkId: check.id,
                count: (await checkFileRepo.findByCheckId(check.id)).length,
            })));
            const counts = new Map(fileCounts.map(item => [item.checkId, item.count]));
            res.json(checks.map(check => mapCheck(check, counts.get(check.id) ?? 0)));
        }
        catch (error) {
            logger_1.logger.error('Failed to list checks', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    router.post('/checks', async (req, res) => {
        try {
            const check = await createCheck.execute({
                type: req.body.type,
                amount: Number(req.body.amount),
                dueDate: new Date(req.body.dueDate),
                ownerName: req.body.ownerName,
                checkNumber: req.body.checkNumber,
                bankName: req.body.bankName,
                description: req.body.description,
                relatedProjectId: req.body.relatedProjectId,
                currency: req.body.currency,
            });
            const fileCount = (await checkFileRepo.findByCheckId(check.id)).length;
            res.status(201).json(mapCheck(check, fileCount));
        }
        catch (error) {
            logger_1.logger.error('Failed to create check', { error: error.message, bodyKeys: Object.keys(req.body || {}) });
            res.status(400).json({ error: error.message });
        }
    });
    router.patch('/checks/:id/status', async (req, res) => {
        try {
            const check = await checkRepo.findById(req.params.id);
            if (!check) {
                return res.status(404).json({ error: 'Check not found' });
            }
            const status = String(req.body.status ?? '').toLowerCase();
            if (status === payment_1.CheckStatus.PAID) {
                const result = await payCheck.execute({
                    checkId: check.id,
                    createdBy: req.user?.id ?? 'system',
                    paidDate: req.body.paidDate ? new Date(req.body.paidDate) : undefined,
                });
                const fileCount = (await checkFileRepo.findByCheckId(result.check.id)).length;
                return res.json({
                    ...mapCheck(result.check, fileCount),
                    transactionId: result.transaction.id,
                });
            }
            if (status === payment_1.CheckStatus.BOUNCED || status === 'returned') {
                check.markAsBounced();
            }
            else if (status === payment_1.CheckStatus.CANCELLED) {
                check.cancel();
            }
            else {
                return res.status(400).json({ error: 'Unsupported status' });
            }
            await checkRepo.save(check);
            await eventBus.publishAll(check.domainEvents);
            check.clearEvents();
            const fileCount = (await checkFileRepo.findByCheckId(check.id)).length;
            res.json(mapCheck(check, fileCount));
        }
        catch (error) {
            logger_1.logger.error('Failed to update check status', { error: error.message, id: req.params.id, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    router.get('/checks/:id/files', async (req, res) => {
        try {
            const check = await checkRepo.findById(req.params.id);
            if (!check) {
                return res.status(404).json({ error: 'Check not found' });
            }
            const files = await checkFileRepo.findByCheckId(req.params.id);
            res.json(files.map(file => mapFile(req.params.id, file)));
        }
        catch (error) {
            logger_1.logger.error('Failed to list check files', { error: error.message, id: req.params.id });
            res.status(500).json({ error: error.message });
        }
    });
    router.post('/checks/:id/files', uploadParser, async (req, res) => {
        try {
            const check = await checkRepo.findById(req.params.id);
            if (!check) {
                return res.status(404).json({ error: 'Check not found' });
            }
            const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? '');
            const contentType = req.headers['content-type'];
            const file = (0, file_1.parseMultipartFile)(body, Array.isArray(contentType) ? contentType[0] : contentType);
            if (!(0, file_1.isValidPaymentFile)(file.mimeType, file.extension)) {
                return res.status(400).json({ error: 'Invalid file format. Only images are allowed for checks.' });
            }
            const fileId = (0, types_1.generateId)();
            const storageDir = getCheckFilesDir();
            const storagePath = path_1.default.join(storageDir, `${fileId}-${file.storedName}`);
            await fs_1.default.promises.writeFile(storagePath, file.buffer);
            const now = new Date();
            await checkFileRepo.save({
                id: fileId,
                checkId: req.params.id,
                name: file.storedName,
                originalName: file.originalName,
                mimeType: file.mimeType,
                size: file.buffer.length,
                storagePath,
                uploadedAt: now,
                createdAt: now,
                updatedAt: now,
            });
            logger_1.logger.info('Check image uploaded', { checkId: req.params.id, fileId, name: file.originalName, size: file.buffer.length });
            res.status(201).json(mapFile(req.params.id, {
                id: fileId,
                checkId: req.params.id,
                name: file.storedName,
                originalName: file.originalName,
                mimeType: file.mimeType,
                size: file.buffer.length,
                storagePath,
                uploadedAt: now,
                createdAt: now,
                updatedAt: now,
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to upload check image', { error: error.message, id: req.params.id });
            res.status(400).json({ error: error.message });
        }
    });
    router.get('/checks/:id/files/:fileId', async (req, res) => {
        try {
            const file = await checkFileRepo.findById(req.params.fileId);
            if (!file || file.checkId !== req.params.id) {
                return res.status(404).json({ error: 'File not found' });
            }
            if (!fs_1.default.existsSync(file.storagePath)) {
                return res.status(404).json({ error: 'File content not found' });
            }
            res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
            res.setHeader('Content-Disposition', `inline; filename="${file.originalName.replace(/"/g, '\\"')}"`);
            fs_1.default.createReadStream(file.storagePath).pipe(res);
        }
        catch (error) {
            logger_1.logger.error('Failed to open check file', { error: error.message, id: req.params.fileId });
            res.status(500).json({ error: error.message });
        }
    });
    router.delete('/checks/:id/files/:fileId', async (req, res) => {
        try {
            const file = await checkFileRepo.findById(req.params.fileId);
            if (!file || file.checkId !== req.params.id) {
                return res.status(404).json({ error: 'File not found' });
            }
            if (fs_1.default.existsSync(file.storagePath)) {
                await fs_1.default.promises.unlink(file.storagePath);
            }
            await checkFileRepo.delete(file.id);
            logger_1.logger.info('Check file deleted', { checkId: req.params.id, fileId: file.id });
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Failed to delete check file', { error: error.message, id: req.params.fileId });
            res.status(400).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=payment.routes.js.map