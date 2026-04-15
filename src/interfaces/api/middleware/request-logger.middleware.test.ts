import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import { createRequestLogger } from './request-logger.middleware';
import { logger } from '@shared/logger';

function createResponse(statusCode: number) {
  const res = new EventEmitter() as Response;
  res.statusCode = statusCode;
  return res;
}

describe('request logger middleware', () => {
  const auditService = {
    recordHttpRequest: vi.fn().mockResolvedValue(undefined),
  } as any;

  beforeEach(() => {
    vi.restoreAllMocks();
    auditService.recordHttpRequest.mockClear();
  });

  it('logs successful requests with redacted sensitive fields', async () => {
    const httpSpy = vi.spyOn(logger, 'http').mockImplementation(() => logger);
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => logger);
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(1_000).mockReturnValueOnce(1_250);

    const middleware = createRequestLogger(auditService);
    const req = {
      method: 'POST',
      originalUrl: '/api/auth/login',
      user: { id: 'user-1' },
      ip: '127.0.0.1',
      body: { username: 'demo', password: 'secret' },
      query: { token: 'abc123', page: '1' },
      headers: { authorization: 'Bearer token', 'x-api-key': 'api-key' },
      socket: { remoteAddress: '127.0.0.1' },
    } as Partial<Request> as Request;
    const res = createResponse(200);

    middleware(req, res, () => undefined);
    res.emit('finish');

    expect(httpSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(auditService.recordHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      path: '/api/auth/login',
      statusCode: 200,
      durationMs: 250,
      userId: 'user-1',
      ip: '127.0.0.1',
      metadata: expect.objectContaining({
        body: expect.objectContaining({ password: '[REDACTED]' }),
        query: expect.objectContaining({ token: '[REDACTED]' }),
      }),
    }));
  });

  it('uses warn level for 4xx responses', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => logger);
    const middleware = createRequestLogger(auditService);
    const req = {
      method: 'GET',
      originalUrl: '/api/projects',
      body: {},
      query: {},
      headers: {},
      socket: {},
    } as Partial<Request> as Request;
    const res = createResponse(404);

    vi.spyOn(Date, 'now').mockReturnValueOnce(1_000).mockReturnValueOnce(1_005);

    middleware(req, res, () => undefined);
    res.emit('finish');

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('uses error level for 5xx responses', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const middleware = createRequestLogger(auditService);
    const req = {
      method: 'GET',
      originalUrl: '/api/projects/1',
      body: {},
      query: {},
      headers: {},
      socket: {},
    } as Partial<Request> as Request;
    const res = createResponse(500);

    vi.spyOn(Date, 'now').mockReturnValueOnce(1_000).mockReturnValueOnce(1_025);

    middleware(req, res, () => undefined);
    res.emit('finish');

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
