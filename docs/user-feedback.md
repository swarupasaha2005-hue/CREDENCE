# Credence User Feedback

## Purpose

Credence collects lightweight, anonymous feedback from people who try the app on
Stellar Testnet — what they liked, what confused them, and what they'd want next.
This is intentionally low-friction: a single external form, no account, no backend,
and no personal data stored inside this application. See the
[`## User Feedback`](../README.md#-user-feedback) section of the README for how the
in-app button is wired up.

## Feedback Form

**Google Form link:** `___` _(fill in with the live form URL — this is also the
value that should be set as `NEXT_PUBLIC_FEEDBACK_FORM_URL`)_

Suggested questions for the form:

- Overall rating (1–5 stars)
- Overall experience (free text or short answer)
- Favorite feature
- What could be improved
- Optional comments

## Collecting Responses From Test Users

1. Set `NEXT_PUBLIC_FEEDBACK_FORM_URL` in the deployment environment so the footer
   **Feedback** button is enabled.
2. Ask testnet users (e.g. the wallets in
   [`docs/testnet-users.md`](testnet-users.md), or anyone trying the live demo) to
   click **Feedback** in the footer after using the app.
3. Responses land in the Google Form's linked **Google Sheet** — open the form in
   Google Forms, go to the **Responses** tab, and either view the summary charts
   there or open the linked spreadsheet for the raw data.
4. Once there are enough responses, fill in the template below with the real
   numbers — do not fabricate or estimate results.

## Feedback Summary

> Fill this in from actual Google Form responses once collected. Leave blanks (`___`)
> until real data exists — do not invent numbers.

- **Total respondents:** ___
- **Average rating:** ___
- **Most requested feature:** ___
- **Positive feedback:** ___
- **Improvements requested:** ___
