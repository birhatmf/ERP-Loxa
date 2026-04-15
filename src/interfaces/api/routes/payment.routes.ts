import express, { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { CreateCheck, PayCheck } from '@application/use-cases/payment/payment.use-cases';
import { ICheckFileRepository, ICheckRepository, CheckType, CheckStatus, CheckFileRecord } from '@domains/payment';
import { ITransactionRepository } from '@domains/finance';
import { EventBus, generateId } from '@shared/types';
import { logger } from '@shared/logger';

function getCheckFilesDir(): string {
  const dir = path.join(process.cwd(), 'data', 'check-files');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w.\-()\s]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^_+|_+$/g, '') || 'file';
}

function parseMultipartFile(body: Buffer, contentType?: string): {
  originalName: string;
  storedName: string;
  mimeType: string;
  buffer: Buffer;
} {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType ?? '');
  if (!boundaryMatch) {
    throw new Error('Multipart boundary not found');
  }

  const boundary = `--${boundaryMatch[1] ?? boundaryMatch[2]}`;
  const raw = body.toString('latin1');
  const parts = raw.split(boundary);

  for (const part of parts) {
    const trimmed = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
    if (!trimmed || trimmed === '--') continue;

    const headerEnd = trimmed.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headerText = trimmed.slice(0, headerEnd);
    const contentText = trimmed.slice(headerEnd + 4).replace(/\r\n$/, '');
    const headers = headerText.split('\r\n');
    const disposition = headers.find(h => h.toLowerCase().startsWith('content-disposition'));

    if (!disposition || !disposition.includes('filename=')) {
      continue;
    }

    const filenameMatch = /filename="([^"]*)"/i.exec(disposition);
    const typeHeader = headers.find(h => h.toLowerCase().startsWith('content-type'));
    const originalName = filenameMatch?.[1] || 'file';

    return {
      originalName,
      storedName: sanitizeFilename(originalName),
      mimeType: typeHeader?.split(':')[1]?.trim() || 'application/octet-stream',
      buffer: Buffer.from(contentText, 'latin1'),
    };
  }

  throw new Error('No file found in multipart payload');
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function mapCheck(check: any, fileCount = 0) {
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

function mapFile(checkId: string, file: CheckFileRecord) {
  return {
    id: file.id,
    name: file.originalName,
    size: file.size,
    type: file.mimeType,
    url: `/api/payment/checks/${checkId}/files/${file.id}`,
    uploadedAt: file.uploadedAt.toISOString(),
  };
}

export function createPaymentRoutes(
  createCheck: CreateCheck,
  payCheck: PayCheck,
  checkRepo: ICheckRepository,
  checkFileRepo: ICheckFileRepository,
  transactionRepo: ITransactionRepository,
  eventBus: EventBus
): Router {
  const router = Router();
  const uploadParser = express.raw({ type: 'multipart/form-data', limit: '10mb' });

  router.get('/checks', async (req: Request, res: Response) => {
    try {
      const checks = await checkRepo.findAll();
      const fileCounts = await Promise.all(checks.map(async check => ({
        checkId: check.id,
        count: (await checkFileRepo.findByCheckId(check.id)).length,
      })));
      const counts = new Map(fileCounts.map(item => [item.checkId, item.count]));
      res.json(checks.map(check => mapCheck(check, counts.get(check.id) ?? 0)));
    } catch (error: any) {
      logger.error('Failed to list checks', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/checks', async (req: Request, res: Response) => {
    try {
      const check = await createCheck.execute({
        type: req.body.type as CheckType,
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
    } catch (error: any) {
      logger.error('Failed to create check', { error: error.message, bodyKeys: Object.keys(req.body || {}) });
      res.status(400).json({ error: error.message });
    }
  });

  router.patch('/checks/:id/status', async (req: Request, res: Response) => {
    try {
      const check = await checkRepo.findById(req.params.id);
      if (!check) {
        return res.status(404).json({ error: 'Check not found' });
      }

      const status = String(req.body.status ?? '').toLowerCase();

      if (status === CheckStatus.PAID) {
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

      if (status === CheckStatus.BOUNCED || status === 'returned') {
        check.markAsBounced();
      } else if (status === CheckStatus.CANCELLED) {
        check.cancel();
      } else {
        return res.status(400).json({ error: 'Unsupported status' });
      }

      await checkRepo.save(check);
      await eventBus.publishAll(check.domainEvents);
      check.clearEvents();

      const fileCount = (await checkFileRepo.findByCheckId(check.id)).length;
      res.json(mapCheck(check, fileCount));
    } catch (error: any) {
      logger.error('Failed to update check status', { error: error.message, id: req.params.id, body: req.body });
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/checks/:id/files', async (req: Request, res: Response) => {
    try {
      const check = await checkRepo.findById(req.params.id);
      if (!check) {
        return res.status(404).json({ error: 'Check not found' });
      }

      const files = await checkFileRepo.findByCheckId(req.params.id);
      res.json(files.map(file => mapFile(req.params.id, file)));
    } catch (error: any) {
      logger.error('Failed to list check files', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/checks/:id/files', uploadParser, async (req: Request, res: Response) => {
    try {
      const check = await checkRepo.findById(req.params.id);
      if (!check) {
        return res.status(404).json({ error: 'Check not found' });
      }

      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? '');
      const contentType = req.headers['content-type'];
      const file = parseMultipartFile(body, Array.isArray(contentType) ? contentType[0] : contentType);

      if (!isImageMimeType(file.mimeType)) {
        return res.status(400).json({ error: 'Only image uploads are allowed' });
      }

      const fileId = generateId();
      const storageDir = getCheckFilesDir();
      const storagePath = path.join(storageDir, `${fileId}-${file.storedName}`);
      await fs.promises.writeFile(storagePath, file.buffer);

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

      logger.info('Check image uploaded', { checkId: req.params.id, fileId, name: file.originalName, size: file.buffer.length });
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
    } catch (error: any) {
      logger.error('Failed to upload check image', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/checks/:id/files/:fileId', async (req: Request, res: Response) => {
    try {
      const file = await checkFileRepo.findById(req.params.fileId);
      if (!file || file.checkId !== req.params.id) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (!fs.existsSync(file.storagePath)) {
        return res.status(404).json({ error: 'File content not found' });
      }

      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${file.originalName.replace(/"/g, '\\"')}"`);
      fs.createReadStream(file.storagePath).pipe(res);
    } catch (error: any) {
      logger.error('Failed to open check file', { error: error.message, id: req.params.fileId });
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/checks/:id/files/:fileId', async (req: Request, res: Response) => {
    try {
      const file = await checkFileRepo.findById(req.params.fileId);
      if (!file || file.checkId !== req.params.id) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (fs.existsSync(file.storagePath)) {
        await fs.promises.unlink(file.storagePath);
      }

      await checkFileRepo.delete(file.id);
      logger.info('Check file deleted', { checkId: req.params.id, fileId: file.id });
      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete check file', { error: error.message, id: req.params.fileId });
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
