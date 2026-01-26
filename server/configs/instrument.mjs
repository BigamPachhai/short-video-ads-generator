import * as Sentry from "@sentry/node";
Sentry.init({
  dsn: "https://7e5ceee5e0212ad10f6902087904fc64@o4510778143735808.ingest.us.sentry.io/4510778157629440",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
