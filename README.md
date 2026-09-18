# AHS time-study helper, September 24–30, 2026

Public release target: https://mikedmote52.github.io/timestudy/. The previous custom hostname returns NXDOMAIN, so GitHub Pages will serve its default HTTPS URL. This version is tied to the exact current AHS attachment, DHCS 5293 revised 05/2026; a future study needs its official form checked before dates change.

## Colleague workflow

1. Paste a personal QGenda calendar subscription URL. Explicitly labeled provider details, per-shift cost centers and activity codes are imported where present. The app never infers normal weekly hours from a single schedule. Shared calendars with conflicting provider names or employee IDs are rejected. The existing MoteOps relay retrieves the calendar. The app prepares September 24–30 automatically and opens the week summary. Calendar-file import and typed shifts remain fallbacks.
2. Reuse provider details from a previous fillable AHS form, if needed. The current email attachment has these fields blank; it is not a colleague roster. Only profile fields are imported, never previous hours or signatures. Saved details are reused in this browser.
3. Review the week once. QGenda scheduled hours start as draft code 00001; correct paid leave, on-call treatment, unpaid breaks and other activities before confirming. Availability blocks labeled Unavailable are excluded. Zero days become unpaid only after explicit whole-week confirmation. Individual exception editing remains available.
4. Download the completed, unsigned 19-page official PDF. Sign with AHS DocuSign, obtain required supervisor/reviewer signature and return via the AHS process. No automatic submission occurs.

## Signing and data limits

The user wants literal QGenda link → prepared form → DocuSign signature. The helper automates preparation and uses the existing AHS DocuSign download/upload process. There is no authorized AHS DocuSign API connection, so download/upload is still necessary. Embedded signing needs an authorized account and integration, envelope creation and recipient signing sessions. Do not substitute a drawn signature: Mike explicitly chose AHS DocuSign because acceptance of other signatures is unknown.

The email's current attachment has blank provider identifiers, normal paid weekly hours and cost centers. A personalized prior form or an authorized roster is needed to eliminate one-time missing-field entry. QGenda contains scheduled assignments, not proof of actual paid activities.

## Privacy and persistence

The private subscription link is sent only to the existing MoteOps relay at timestudy-relay.mikedmote5258.workers.dev for retrieval; frontend accepts only HTTPS app.qgenda.com/ical links with a key (webcal is normalized). The key is not saved in localStorage or sharing links and is cleared after a successful import. Relay operator logging behavior is not verified. No analytics or AI parsing is used. The relay is live and rejects unrelated hosts; a real private feed has not been tested in this session.

PDF generation and prior-form extraction happen locally with pinned pdf-lib 1.17.1. Calendar parsing uses bundled ical.js 2.2.1. Calendar times are converted to Pacific dates independent of the browser zone. Cancellation revisions, recurrence exclusions and overnight boundaries are handled. All-day entries with one explicit clock range are recovered automatically; missing or ambiguous times are rejected rather than invented. A failed import preserves reported hours. Draft entries stay in this browser and do not sync across devices. Clear this device removes app drafts and legacy signatures. Sharing links contain only the study date. Email buttons prepare text; they do not attach or send files.

## Validation completed

33 automated tests pass in Pacific and Eastern time zones, including relay request construction, successful/failed import, date splitting, recurrence/cancellation behavior, blank signature preservation, profile import and actual PDF generation. Chrome synthetic ICS → prior-profile PDF → whole-week confirmation → PDF download completed. The resulting 19-page PDF contained 9 hours September 24 and 1 hour September 25 with both signatures blank. Synthetic browser data was cleared. No real signature, submission or outbound email occurred.

## Hosting

Mike's latest explicit request is a public link he can send to anyone. This authorizes publishing the preparation helper; it does not authorize sending messages, signing or submitting studies. Publish the current branch as a fast-forward to main and remove the broken custom-domain binding so GitHub Pages serves https://mikedmote52.github.io/timestudy/. No force push or repository visibility changes. Validate the public page and PDF assets after deployment. The old timestudy.moteops.tech DNS remains a separate unresolved issue.

No AHS DocuSign API connection is configured. Signing and submission require the official AHS process shown in the app. The site is an independent helper, not an official AHS service.

## Workplace coding, September 18 update

Colleagues no longer have to supply an accounting code in the missing-details screen. Matching Highland ED shift names reuse17013 from the local April22–28,2026 filled AHS form (ER Dept Code and activity CCC fields). The source is a previous form, not a currently verified department directory; UI discloses this. No personal data or prior PDF is published. Named location choice also fills missing patient-care codes. Existing explicit codes remain untouched; mixed or unrecognized locations are not guessed. Nonpatient activities are not automatically assigned this clinical-location code.

Unresolved coding permits only an explicitly named coordinator-review draft with an extra warning cover; regular export still rejects missing codes. Both signatures remain blank. Actual hours, review, identity and variance checks still apply. Email text becomes a coding-review request while codes are pending; no email is sent. Forty tests pass, including mapping scope, preservation, mixed locations and draft safeguards.

Hours-difference shortcut: shows the exact reported/normal hours and offers an explicitly chosen varying-weekly-schedule explanation. The app never selects a reason for the colleague. Generated explanations are cleared when their totals change, including after reopening; personally edited reasons are preserved. The required reason still exports to the official justification field.
