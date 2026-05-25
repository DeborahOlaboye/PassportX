import { notificationTemplateManager } from '../../src/services/NotificationTemplateManager';

describe('Notification Template Manager', () => {
  beforeEach(() => {
    notificationTemplateManager.clear();
  });

  describe('registerTemplate', () => {
    it('should register a template', () => {
      const template = {
        id: 'template-1',
        type: 'email',
        subject: 'Test',
        body: 'Hello {{name}}',
        variables: ['name'],
      };
      notificationTemplateManager.registerTemplate(template);
      const retrieved = notificationTemplateManager.getTemplate('template-1');
      expect(retrieved).toEqual(template);
    });
  });

  describe('getTemplate', () => {
    it('should return template by id', () => {
      const template = {
        id: 'template-1',
        type: 'email',
        subject: 'Test',
        body: 'Hello {{name}}',
        variables: ['name'],
      };
      notificationTemplateManager.registerTemplate(template);
      const retrieved = notificationTemplateManager.getTemplate('template-1');
      expect(retrieved).toEqual(template);
    });

    it('should return null for non-existent template', () => {
      const retrieved = notificationTemplateManager.getTemplate('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('renderTemplate', () => {
    it('should render template with variables', () => {
      const template = {
        id: 'template-1',
        type: 'email',
        subject: 'Test',
        body: 'Hello {{name}}',
        variables: ['name'],
      };
      notificationTemplateManager.registerTemplate(template);
      const rendered = notificationTemplateManager.renderTemplate(
        'template-1',
        { name: 'John' }
      );
      expect(rendered).toBe('Hello John');
    });

    it('should return empty string for non-existent template', () => {
      const rendered = notificationTemplateManager.renderTemplate(
        'non-existent',
        {}
      );
      expect(rendered).toBe('');
    });
  });

  describe('getAllTemplates', () => {
    it('should return all templates', () => {
      const template1 = {
        id: 'template-1',
        type: 'email',
        subject: 'Test 1',
        body: 'Body 1',
        variables: [],
      };
      const template2 = {
        id: 'template-2',
        type: 'email',
        subject: 'Test 2',
        body: 'Body 2',
        variables: [],
      };
      notificationTemplateManager.registerTemplate(template1);
      notificationTemplateManager.registerTemplate(template2);
      const templates = notificationTemplateManager.getAllTemplates();
      expect(templates).toHaveLength(2);
    });
  });

  describe('removeTemplate', () => {
    it('should remove template', () => {
      const template = {
        id: 'template-1',
        type: 'email',
        subject: 'Test',
        body: 'Body',
        variables: [],
      };
      notificationTemplateManager.registerTemplate(template);
      const removed = notificationTemplateManager.removeTemplate('template-1');
      expect(removed).toBe(true);
      expect(notificationTemplateManager.getTemplate('template-1')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all templates', () => {
      const template = {
        id: 'template-1',
        type: 'email',
        subject: 'Test',
        body: 'Body',
        variables: [],
      };
      notificationTemplateManager.registerTemplate(template);
      notificationTemplateManager.clear();
      expect(notificationTemplateManager.getAllTemplates()).toHaveLength(0);
    });
  });
});
