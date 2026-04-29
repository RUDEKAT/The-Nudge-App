import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampler: (samplingContext) => {
    if (samplingContext.request?.url?.includes('/api/')) {
      return 0.5;
    }
    return 0.1;
  },

  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV,

  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});