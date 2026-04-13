import { errorDeduplicator } from './ErrorDeduplicator';

describe('ErrorDeduplicator Integration with ErrorHandler', () => {
  beforeEach(() => {
    errorDeduplicator.clear();
  });

  it('should integrate with ErrorHandler correctly', () => {
    const shouldLog1 = errorDeduplicator.shouldLogError('test error');
    expect(shouldLog1).toBe(true);

    const shouldLog2 = errorDeduplicator.shouldLogError('test error');
    expect(shouldLog2).toBe(false);
  });

  it('should track different errors separately', () => {
    errorDeduplicator.shouldLogError('error1');
    errorDeduplicator.shouldLogError('error2');
    const stats = errorDeduplicator.getStats();
    expect(stats.uniqueErrors).toBe(2);
  });
});
