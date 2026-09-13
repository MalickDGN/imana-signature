'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const VISITOR_KEY = 'imana_visitor_id';
const SESSION_KEY = 'imana_session_id';
const LAST_PAGE_EVENT_KEY = 'imana_last_page_event';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const visitorId = getOrCreate(localStorage, VISITOR_KEY);
    const existingSession = sessionStorage.getItem(SESSION_KEY);
    const sessionId = existingSession ?? createId();
    if (!existingSession) sessionStorage.setItem(SESSION_KEY, sessionId);

    const params = new URLSearchParams(window.location.search);
    const common = {
      visitorId,
      sessionId,
      path: `${pathname}${window.location.search}`,
      referrer: document.referrer || undefined,
      source:
        params.get('utm_source') ??
        sourceFromReferrer(document.referrer) ??
        undefined,
      medium: params.get('utm_medium') ?? undefined,
      campaign: params.get('utm_campaign') ?? undefined,
    };
    if (!existingSession) sendEvent({ ...common, eventName: 'session_start' });
    const pageKey = common.path;
    const lastPageEvent = sessionStorage.getItem(LAST_PAGE_EVENT_KEY);
    const [lastPath, lastTime] = lastPageEvent?.split('|') ?? [];
    if (lastPath !== pageKey || Date.now() - Number(lastTime) > 1500) {
      sessionStorage.setItem(LAST_PAGE_EVENT_KEY, `${pageKey}|${Date.now()}`);
      sendEvent({ ...common, eventName: 'page_view' });
    }
  }, [pathname]);

  return null;
}

export function trackConversion(orderId: string) {
  const key = `imana_conversion_${orderId}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  sendEvent({
    eventName: 'conversion',
    visitorId: getOrCreate(localStorage, VISITOR_KEY),
    sessionId: getOrCreate(sessionStorage, SESSION_KEY),
    path: window.location.pathname,
    metadata: { orderId },
  });
}

function sendEvent(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      '/api/analytics/events',
      new Blob([body], { type: 'application/json' }),
    );
    return;
  }
  void fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  });
}

function getOrCreate(storage: Storage, key: string) {
  const current = storage.getItem(key);
  if (current) return current;
  const value = createId();
  storage.setItem(key, value);
  return value;
}

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function sourceFromReferrer(referrer: string) {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname;
    return host === window.location.hostname ? 'internal' : host;
  } catch {
    return undefined;
  }
}
