export interface NotificationTemplate {
  id: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
}

class NotificationTemplateManager {
  private templates: Map<string, NotificationTemplate> = new Map();

  registerTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): NotificationTemplate | null {
    return this.templates.get(id) || null;
  }

  renderTemplate(id: string, variables: Record<string, string>): string {
    const template = this.getTemplate(id);
    if (!template) return '';

    let rendered = template.body;
    Object.entries(variables).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return rendered;
  }

  getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  removeTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  clear(): void {
    this.templates.clear();
  }
}

export const notificationTemplateManager = new NotificationTemplateManager();
