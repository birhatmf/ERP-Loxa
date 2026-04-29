import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../../shared/audit/audit.service';
export declare function createRequestLogger(auditService: AuditService): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=request-logger.middleware.d.ts.map