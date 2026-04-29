import posthog from 'posthog-js';

let initialized = false;

export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (initialized) return;
  
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    console.warn('PostHog not configured - analytics disabled');
    return;
  }

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    ui_host: 'https://app.posthog.com',
    person_profiles: 'always',
    capture_pageview: false,
    capture_pageleave: true,
  });

  initialized = true;
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!initialized) {
    initPostHog();
  }
  
  if (process.env.NODE_ENV !== 'development') {
    posthog.capture(event, properties);
  }
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  if (!initialized) {
    initPostHog();
  }
  
  posthog.identify(userId, properties);
}

export function setUserProperties(properties: Record<string, unknown>) {
  if (!initialized) {
    initPostHog();
  }
  
  posthog.setPersonProperties(properties);
}

export const trackEvents = {
  onboardingStarted: () => capture('onboarding_started'),
  onboardingStepCompleted: (step: number) => capture('onboarding_step_completed', { step }),
  onboardingCompleted: () => capture('onboarding_completed'),
  ideaGenerated: (niche: string, platform: string) => capture('idea_generated', { niche, platform }),
  ideaUsed: (ideaType: string, platform: string) => capture('idea_used', { ideaType, platform }),
  ideaDismissed: (ideaType: string) => capture('idea_dismissed', { ideaType }),
  reminderSet: (platform: string) => capture('reminder_set', { platform }),
  upgradeCtaClicked: () => capture('upgrade_cta_clicked'),
  apiKeySaved: () => capture('api_key_saved'),
  providerChanged: (provider: string) => capture('provider_changed', { provider }),
} as const;