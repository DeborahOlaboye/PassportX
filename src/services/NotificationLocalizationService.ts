export interface LocaleConfig {
  defaultLocale: string;
  supportedLocales: string[];
}

class NotificationLocalizationService {
  private config: LocaleConfig = {
    defaultLocale: 'en',
    supportedLocales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
  };

  private translations: Record<string, Record<string, string>> = {
    en: {
      badge_earned: 'Badge Earned',
      badge_revoked: 'Badge Revoked',
      community_invitation: 'Community Invitation',
      achievement_milestone: 'Achievement Milestone',
    },
    es: {
      badge_earned: 'Insignia Obtenida',
      badge_revoked: 'Insignia Revocada',
      community_invitation: 'Invitación de Comunidad',
      achievement_milestone: 'Hito de Logro',
    },
    fr: {
      badge_earned: 'Badge Obtenu',
      badge_revoked: 'Badge Révoqué',
      community_invitation: 'Invitation de Communauté',
      achievement_milestone: 'Jalon de Réalisation',
    },
  };

  translate(key: string, locale: string = this.config.defaultLocale): string {
    const localeTranslations =
      this.translations[locale] || this.translations[this.config.defaultLocale];
    return localeTranslations[key] || key;
  }

  setConfig(config: Partial<LocaleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LocaleConfig {
    return { ...this.config };
  }

  addTranslations(locale: string, translations: Record<string, string>): void {
    if (!this.translations[locale]) {
      this.translations[locale] = {};
    }
    this.translations[locale] = {
      ...this.translations[locale],
      ...translations,
    };
  }

  getSupportedLocales(): string[] {
    return [...this.config.supportedLocales];
  }

  isLocaleSupported(locale: string): boolean {
    return this.config.supportedLocales.includes(locale);
  }
}

export const notificationLocalizationService =
  new NotificationLocalizationService();
