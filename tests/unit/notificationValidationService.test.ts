import { notificationValidationService } from '../../src/services/NotificationValidationService';

describe('Notification Validation Service', () => {
  beforeEach(() => {
    notificationValidationService.clear();
  });

  describe('addRule', () => {
    it('should add a validation rule', () => {
      const rule = {
        name: 'test',
        validate: () => true,
        errorMessage: 'Test error',
      };
      notificationValidationService.addRule(rule);
      const rules = notificationValidationService.getRules();
      expect(rules).toHaveLength(1);
    });
  });

  describe('removeRule', () => {
    it('should remove a validation rule', () => {
      const rule = {
        name: 'test',
        validate: () => true,
        errorMessage: 'Test error',
      };
      notificationValidationService.addRule(rule);
      notificationValidationService.removeRule('test');
      const rules = notificationValidationService.getRules();
      expect(rules).toHaveLength(0);
    });
  });

  describe('validate', () => {
    it('should return valid when no rules fail', () => {
      const rule = {
        name: 'test',
        validate: () => true,
        errorMessage: 'Test error',
      };
      notificationValidationService.addRule(rule);
      const result = notificationValidationService.validate({});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when rule fails', () => {
      const rule = {
        name: 'test',
        validate: () => false,
        errorMessage: 'Test error',
      };
      notificationValidationService.addRule(rule);
      const result = notificationValidationService.validate({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Test error');
    });
  });

  describe('getRules', () => {
    it('should return all rules', () => {
      const rule = {
        name: 'test',
        validate: () => true,
        errorMessage: 'Test error',
      };
      notificationValidationService.addRule(rule);
      const rules = notificationValidationService.getRules();
      expect(rules).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all rules', () => {
      const rule = {
        name: 'test',
        validate: () => true,
        errorMessage: 'Test error',
      };
      notificationValidationService.addRule(rule);
      notificationValidationService.clear();
      expect(notificationValidationService.getRules()).toHaveLength(0);
    });
  });
});
