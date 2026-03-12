describe('logger', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('timestamps', () => {
    it('includes an ISO 8601 timestamp in development output', () => {
      process.env.NODE_ENV = 'development';
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const logger = require('../../utils/logger').default;

      logger.info('test message');

      expect(spy).toHaveBeenCalledTimes(1);
      const firstArg: string = spy.mock.calls[0][0];
      expect(firstArg).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      spy.mockRestore();
    });
  });

  describe('meta omission', () => {
    it('does not append extra arguments when meta is undefined', () => {
      process.env.NODE_ENV = 'development';
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const logger = require('../../utils/logger').default;

      logger.info('no meta');

      const callArgs = spy.mock.calls[0];
      // Should only have the prefix string — no extra empty string
      expect(callArgs).toHaveLength(1);
      spy.mockRestore();
    });

    it('forwards meta when provided', () => {
      process.env.NODE_ENV = 'development';
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const logger = require('../../utils/logger').default;
      const meta = { userId: 'abc' };

      logger.info('with meta', meta);

      const callArgs = spy.mock.calls[0];
      expect(callArgs).toHaveLength(2);
      expect(callArgs[1]).toBe(meta);
      spy.mockRestore();
    });
  });

  describe('LOG_LEVEL filtering', () => {
    it('suppresses info when LOG_LEVEL=warn', () => {
      process.env.NODE_ENV = 'development';
      process.env.LOG_LEVEL = 'warn';
      const infoSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const logger = require('../../utils/logger').default;

      logger.info('should be suppressed');
      logger.warn('should appear');

      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      infoSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('suppresses nothing when LOG_LEVEL=debug', () => {
      process.env.NODE_ENV = 'development';
      process.env.LOG_LEVEL = 'debug';
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const debugSpy = jest
        .spyOn(console, 'debug')
        .mockImplementation(() => {});
      const logger = require('../../utils/logger').default;

      logger.info('info');
      logger.debug('debug');

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(debugSpy).toHaveBeenCalledTimes(1);
      logSpy.mockRestore();
      debugSpy.mockRestore();
    });
  });

  describe('production JSON output', () => {
    it('writes a valid JSON line to stdout in production', () => {
      process.env.NODE_ENV = 'production';
      const writeSpy = jest
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true);
      const logger = require('../../utils/logger').default;

      logger.info('prod message', { key: 'value' });

      expect(writeSpy).toHaveBeenCalledTimes(1);
      const written = writeSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(written.trim());
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('prod message');
      expect(parsed.meta).toEqual({ key: 'value' });
      expect(parsed.time).toMatch(/\d{4}-\d{2}-\d{2}T/);
      writeSpy.mockRestore();
    });

    it('omits meta field from JSON when not provided', () => {
      process.env.NODE_ENV = 'production';
      const writeSpy = jest
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true);
      const logger = require('../../utils/logger').default;

      logger.warn('no meta here');

      const written = writeSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(written.trim());
      expect(parsed).not.toHaveProperty('meta');
      writeSpy.mockRestore();
    });
  });
});
