# EUROSPEED SMTP service

Deploy this directory as a Vercel project (Framework: Other, Root Directory: smtp-service). Disable Deployment Protection for the production endpoint so the assessment backend can call it. Requests require HMAC authentication.

Set production environment variables in the hosting dashboard, never in git:

- SMTP_USER: d.stoyanov@eu-speed.com
- SMTP_PASS: Google Workspace app password
- MAIL_WEBHOOK_SECRET: the shared key from the assessment admin mail settings

Redeploy after setting variables. Save https://PROJECT.vercel.app/api/send in the assessment admin mail settings. No app password is entered into the assessment site.

The sender is fixed. Unknown SMTP outcomes are quarantined for manual inspection, as SMTP does not guarantee idempotent delivery. Check Sent before retrying uncertain messages. A successful send means SMTP acceptance, not inbox delivery.
