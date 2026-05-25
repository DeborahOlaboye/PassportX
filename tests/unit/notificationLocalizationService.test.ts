import { notificationLocalizationService } from '../../src/services/NotificationLocalizationService';

describe('Notification Localization Service', () => {
  describe('translate', () => {
    it('should translate key to English by default', () => {
      const translated =
        notificationLocalizationService.translate('badge_earned');
      expect(translated).toBe('Badge Earned');
    });

    it('should translate key to Spanish', () => {
      const translated = notificationLocalizationService.translate(
        'badge_earned',
        'es'
      );
      expect(translated).toBe('Insignia Obtenida');
    });

    it('should return key if translation not found', () => {
      const translated =
        notificationLocalizationService.translate('unknown_key');
      expect(translated).toBe('unknown_key');
    });
  });

  describe('setConfig', () => {
    it('should update config', () => {
      notificationLocalizationService.setConfig({ defaultLocale: 'es' });
      const config = notificationLocalizationService.getConfig();
      expect(config.defaultLocale).toBe('es');
    });
  });

  describe('getConfig', () => {
    it('should return current config', () => {
      const config = notificationLocalizationService.getConfig();
      expect(config.defaultLocale).toBe('en');
      expect(config.supportedLocales).toContain('en');
    });
  });

  describe('addTranslations', () => {
    it('should add translations for a locale', () => {
      notificationLocalizationService.addTranslations('it', {
        badge_earned: 'Badge Guadagnato',
      });
      const translated = notificationLocalizationService.translate(
        'badge_earned',
        'it'
      );
      expect(translated).toBe('Badge Guadagnato');
    });
  });

  describe('getSupportedLocales', () => {
    it('should return supported locales', () => {
      const locales = notificationLocalizationService.getSupportedLocales();
      expect(locales).toContain('en');
      expect(locales).toContain('es');
    });
  });

  describe('isLocaleSupported', () => {
    it('should return true for supported locale', () => {
      const supported = notificationLocalizationService.isLocaleSupported('en');
      expect(supported).toBe(true);
    });

    it('should return false for unsupported locale', () => {
      const supported = notificationLocalizationService.isLocaleSupported('it');
      expect(supported).toBe(false);
    });
  });
});
