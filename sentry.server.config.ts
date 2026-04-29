import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampler: (samplingContext) => {
    if (samplingContext.request?.url?.includes('/api/')) {
      return 0.5;
    }
    return 0.1;
  },

  environment: process.env.NODE_ENV,

  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});