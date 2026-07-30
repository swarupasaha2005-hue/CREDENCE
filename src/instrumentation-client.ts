import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (isProduction && dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,

    // Scrub anything that looks like a secret/key before it ever leaves the browser.
    beforeSend(event) {
      delete event.request?.cookies;
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
