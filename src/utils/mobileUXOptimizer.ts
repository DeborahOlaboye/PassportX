export interface MobileUXConfig {
  enableTouchFeedback: boolean;
  enableSwipeGestures: boolean;
  optimizeForSmallScreens: boolean;
  enablePullToRefresh: boolean;
  enableFastTap: boolean;
}

export class MobileUXOptimizer {
  private static instance: MobileUXOptimizer;
  private config: MobileUXConfig;
  private isMobile: boolean = false;
  private touchStartY: number = 0;
  private pullRefreshEnabled: boolean = false;

  private constructor() {
    this.config = {
      enableTouchFeedback: true,
      enableSwipeGestures: true,
      optimizeForSmallScreens: true,
      enablePullToRefresh: false,
      enableFastTap: true,
    };

    this.detectMobile();
    this.initialize();
  }

  public static getInstance(): MobileUXOptimizer {
    if (!MobileUXOptimizer.instance) {
      MobileUXOptimizer.instance = new MobileUXOptimizer();
    }
    return MobileUXOptimizer.instance;
  }

  private detectMobile(): void {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent.toLowerCase();
    this.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  }

  private initialize(): void {
    if (typeof window === 'undefined' || !this.isMobile) return;

    this.setupViewport();
    this.setupTouchFeedback();
    this.setupSwipeGestures();
    this.setupFastTap();
  }

  private setupViewport(): void {
    // Ensure proper viewport settings for mobile
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }

    // Prevent zoom on input focus (iOS)
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover'
          );
        }
      });

      input.addEventListener('blur', () => {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
          );
        }
      });
    });
  }

  private setupTouchFeedback(): void {
    if (!this.config.enableTouchFeedback) return;

    // Add touch feedback to interactive elements
    document.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement;
      if (target && this.isInteractiveElement(target)) {
        target.style.transform = 'scale(0.98)';
        target.style.transition = 'transform 0.1s ease';
      }
    });

    document.addEventListener('touchend', (e) => {
      const target = e.target as HTMLElement;
      if (target && this.isInteractiveElement(target)) {
        target.style.transform = 'scale(1)';
      }
    });
  }

  private setupSwipeGestures(): void {
    if (!this.config.enableSwipeGestures) return;

    let startX: number;
    let startY: number;
    let isTracking = false;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isTracking = true;
    });

    document.addEventListener('touchmove', (e) => {
      if (!isTracking) return;

      const deltaX = e.touches[0].clientX - startX;
      const deltaY = e.touches[0].clientY - startY;

      // Detect horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        const direction = deltaX > 0 ? 'right' : 'left';
        this.handleSwipeGesture(direction, Math.abs(deltaX));
        isTracking = false;
      }
    });

    document.addEventListener('touchend', () => {
      isTracking = false;
    });
  }

  private setupFastTap(): void {
    if (!this.config.enableFastTap) return;

    // Remove 300ms tap delay on mobile
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
    `;
    document.head.appendChild(style);
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    const interactiveRoles = ['button', 'link', 'checkbox', 'radio', 'tab'];

    return (
      interactiveTags.includes(element.tagName) ||
      interactiveRoles.includes(element.getAttribute('role') || '') ||
      element.onclick !== null ||
      element.getAttribute('data-interactive') === 'true'
    );
  }

  private handleSwipeGesture(direction: 'left' | 'right', distance: number): void {
    // Dispatch custom event for swipe gestures
    const event = new CustomEvent('mobileSwipe', {
      detail: { direction, distance }
    });
    document.dispatchEvent(event);
  }

  public enablePullToRefresh(callback: () => void): void {
    if (!this.isMobile || !this.config.enablePullToRefresh) return;

    this.pullRefreshEnabled = true;

    document.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchmove', (e) => {
      if (!this.pullRefreshEnabled) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - this.touchStartY;

      if (diff > 100 && window.scrollY === 0) {
        // Show pull-to-refresh indicator
        this.showPullToRefreshIndicator();
      }
    });

    document.addEventListener('touchend', (e) => {
      if (!this.pullRefreshEnabled) return;

      const currentY = e.changedTouches[0].clientY;
      const diff = currentY - this.touchStartY;

      if (diff > 150 && window.scrollY === 0) {
        callback();
        this.hidePullToRefreshIndicator();
      }
    });
  }

  private showPullToRefreshIndicator(): void {
    let indicator = document.getElementById('pull-refresh-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'pull-refresh-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: #007bff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        z-index: 1000;
        transform: translateY(-100%);
        transition: transform 0.3s ease;
      `;
      indicator.textContent = 'Pull to refresh';
      document.body.appendChild(indicator);
    }

    indicator.style.transform = 'translateY(0)';
  }

  private hidePullToRefreshIndicator(): void {
    const indicator = document.getElementById('pull-refresh-indicator');
    if (indicator) {
      indicator.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        indicator.remove();
      }, 300);
    }
  }

  public optimizeModalForMobile(modal: HTMLElement): void {
    if (!this.isMobile) return;

    // Make modal full screen on small devices
    if (window.innerHeight < 600) {
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.borderRadius = '0';
      modal.style.margin = '0';
    }

    // Add safe area padding for devices with notches
    const safeAreaTop = 'env(safe-area-inset-top)';
    const safeAreaBottom = 'env(safe-area-inset-bottom)';

    modal.style.paddingTop = `max(1rem, ${safeAreaTop})`;
    modal.style.paddingBottom = `max(1rem, ${safeAreaBottom})`;
  }

  public optimizeQRCodeForMobile(qrCodeElement: HTMLElement): void {
    if (!this.isMobile) return;

    // Ensure QR code is properly sized for mobile scanning
    const screenWidth = window.innerWidth;
    const qrSize = Math.min(screenWidth * 0.8, 300);

    qrCodeElement.style.width = `${qrSize}px`;
    qrCodeElement.style.height = `${qrSize}px`;
    qrCodeElement.style.maxWidth = '100%';
    qrCodeElement.style.objectFit = 'contain';
  }

  public isMobileDevice(): boolean {
    return this.isMobile;
  }

  public getConfig(): MobileUXConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<MobileUXConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public vibrate(pattern: number | number[] = 50): void {
    if (this.isMobile && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  public shareContent(data: ShareData): Promise<void> {
    if (this.isMobile && 'share' in navigator) {
      return navigator.share(data);
    }
    return Promise.reject(new Error('Web Share API not supported'));
  }
}

// Convenience functions
export const isMobileDevice = (): boolean => {
  return MobileUXOptimizer.getInstance().isMobileDevice();
};

export const optimizeModalForMobile = (modal: HTMLElement): void => {
  MobileUXOptimizer.getInstance().optimizeModalForMobile(modal);
};

export const optimizeQRCodeForMobile = (qrCodeElement: HTMLElement): void => {
  MobileUXOptimizer.getInstance().optimizeQRCodeForMobile(qrCodeElement);
};

export const vibrateDevice = (pattern?: number | number[]): void => {
  MobileUXOptimizer.getInstance().vibrate(pattern);
};

export const shareWalletConnection = async (uri: string): Promise<void> => {
  try {
    await MobileUXOptimizer.getInstance().shareContent({
      title: 'Connect to PassportX',
      text: 'Scan this QR code to connect your wallet',
      url: uri,
    });
  } catch (error) {
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(uri);
  }
};