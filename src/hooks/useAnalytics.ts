import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { analyticsService } from '@/lib/analytics/analytics.service';

export function useAnalytics() {
  const router = useRouter();

  // Track page views
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      analyticsService.trackPageView(url);
    };

    // Track the first pageview
    if (router.pathname) {
      analyticsService.trackPageView(router.pathname);
    }

    // Track subsequent route changes
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return {
    trackEvent: analyticsService.trackEvent.bind(analyticsService),
    trackWalletConnect: analyticsService.trackWalletConnect.bind(analyticsService),
    trackTransactionCompleted: analyticsService.trackTransactionCompleted.bind(analyticsService),
    trackError: analyticsService.trackError.bind(analyticsService),
    setWalletAddress: analyticsService.setWalletAddress.bind(analyticsService),
  };
}

export default useAnalytics;
