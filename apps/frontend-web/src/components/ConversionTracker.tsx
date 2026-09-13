'use client';

import { useEffect } from 'react';
import { trackConversion } from './AnalyticsTracker';

export function ConversionTracker({ orderId }: { orderId?: string }) {
  useEffect(() => {
    if (orderId) trackConversion(orderId);
  }, [orderId]);
  return null;
}
