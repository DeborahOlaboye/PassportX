import { notificationEventBus } from '../../src/services/NotificationEventBus';

describe('Notification Event Bus', () => {
  beforeEach(() => {
    notificationEventBus.removeAllListeners();
  });

  describe('on', () => {
    it('should register an event listener', () => {
      const handler = jest.fn();
      notificationEventBus.on('test', handler);
      notificationEventBus.emit('test', 'data');
      expect(handler).toHaveBeenCalledWith('data');
    });
  });

  describe('off', () => {
    it('should remove an event listener', () => {
      const handler = jest.fn();
      notificationEventBus.on('test', handler);
      notificationEventBus.off('test', handler);
      notificationEventBus.emit('test', 'data');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should emit event to all listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      notificationEventBus.on('test', handler1);
      notificationEventBus.on('test', handler2);
      notificationEventBus.emit('test', 'data');
      expect(handler1).toHaveBeenCalledWith('data');
      expect(handler2).toHaveBeenCalledWith('data');
    });

    it('should handle errors in listeners gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalHandler = jest.fn();
      notificationEventBus.on('test', errorHandler);
      notificationEventBus.on('test', normalHandler);
      notificationEventBus.emit('test', 'data');
      expect(normalHandler).toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should register a one-time listener', () => {
      const handler = jest.fn();
      notificationEventBus.once('test', handler);
      notificationEventBus.emit('test', 'data1');
      notificationEventBus.emit('test', 'data2');
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('data1');
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for an event', () => {
      const handler = jest.fn();
      notificationEventBus.on('test', handler);
      notificationEventBus.removeAllListeners('test');
      notificationEventBus.emit('test', 'data');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should remove all listeners for all events', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      notificationEventBus.on('test1', handler1);
      notificationEventBus.on('test2', handler2);
      notificationEventBus.removeAllListeners();
      notificationEventBus.emit('test1', 'data1');
      notificationEventBus.emit('test2', 'data2');
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return listener count for an event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      notificationEventBus.on('test', handler1);
      notificationEventBus.on('test', handler2);
      expect(notificationEventBus.listenerCount('test')).toBe(2);
    });

    it('should return 0 for non-existent event', () => {
      expect(notificationEventBus.listenerCount('nonexistent')).toBe(0);
    });
  });

  describe('eventNames', () => {
    it('should return all event names', () => {
      notificationEventBus.on('test1', jest.fn());
      notificationEventBus.on('test2', jest.fn());
      const names = notificationEventBus.eventNames();
      expect(names).toContain('test1');
      expect(names).toContain('test2');
    });
  });
});
