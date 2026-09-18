# AHS time-study helper, September 24–30, 2026

Local release candidate. Not yet published. The production hostname currently returns NXDOMAIN. This version is tied to the exact current AHS attachment, DHCS 5293 revised 05/2026; a future study needs its official form checked before dates change.

## Colleague workflow

1. Paste a personal QGenda calendar subscription URL. The existing MoteOps relay retrieves the calendar. The app prepares September 24–30 automatically and opens the week summary. Calendar-file import and typed shifts remain fallbacks.
2. Reuse provider details from a previous fillable AHS form, if needed. The current email attachment has these fields blank; it is not a colleague roster. Only profile fields are imported, never previous hours or signatures. Saved details are reused in this browser.
3. Review the week once. QGenda scheduled hours start as draft code 00001; correct paid leave, on-call treatment, unpaid breaks and other activities before confirming. Availability blocks labeled Unavailable are excluded. Zero days become unpaid only after explicit whole-week confirmation. Individual exception editing remains available.
4. Download the completed, unsigned 19-page official PDF. Sign with AHS DocuSign, obtain required supervisor/reviewer signature and return via the AHS process. No automatic submission occurs.

## Unfinished requirements

The user wants literal QGenda link → prepared form → DocuSign signature. This preview does not yet deliver that entire experience. There is no authorized AHS DocuSign API connection, so download/upload is still necessary. Embedded signing needs an authorized account and integration, envelope creation and recipient signing sessions. Do not substitute a drawn signature: Mike explicitly chose AHS DocuSign because acceptance of other signatures is unknown.

The email's current attachment has blank provider identifiers, normal paid weekly hours and cost centers. A personalized prior form or an authorized roster is needed to eliminate one-time missing-field entry. QGenda contains scheduled assignments, not proof of actual paid activities.

## Privacy and persistence

The private subscription link is sent only to the existing MoteOps relay at timestudy-relay.mikedmote5258.workers.dev for retrieval; frontend accepts only HTTPS app.qgenda.com/ical links with a key (webcal is normalized). The key is not saved in localStorage or sharing links and is cleared after a successful import. Relay operator logging behavior is not verified. No analytics or AI parsing is used. The relay is live and rejects unrelated hosts; a real private feed has not been tested in this session.

PDF generation and prior-form extraction happen locally with pinned pdf-lib 1.17.1. Calendar parsing uses bundled ical.js 2.2.1. Calendar times are converted to Pacific dates independent of the browser zone. Cancellation revisions, recurrence exclusions and overnight boundaries are handled. Missing all-day shift times are rejected rather than invented. A failed import preserves reported hours. Draft entries stay in this browser and do not sync across devices. Clear this device removes app drafts and legacy signatures. Sharing links contain only the study date. Email buttons prepare text; they do not attach or send files.

## Validation completed

28 automated tests pass in Pacific and Eastern time zones, including relay request construction, successful/failed import, date splitting, recurrence/cancellation behavior, blank signature preservation, profile import and actual PDF generation. Chrome synthetic ICS → prior-profile PDF → whole-week confirmation → PDF download completed. The resulting 19-page PDF contained 9 hours September 24 and 1 hour September 25 with both signatures blank. Synthetic browser data was cleared. No real signature, submission or outbound email occurred.

## Release remaining

User approval is required before publishing under the standing `/Users/michaelmote/AGENTS.md` rule: “Site deploys ... require explicit confirmation in the same session.”

After approval: publish this candidate to `mikedmote52/timestudy` main (GitHub Pages root), restore the missing Cloudflare DNS CNAME `timestudy` to `mikedmote52.github.io` with DNS-only handling appropriate for GitHub Pages, verify domain ownership/certificate and HTTPS, then repeat a fresh synthetic end-to-end download on the public URL. Do not send colleague emails without a separate send instruction. DNS account access has not yet been verified.

The local preview is served at http://127.0.0.1:8769/ while this session's server is running. Source base: 6695a47b7351f5032e3ed5cb09d8d02c402d6f2f. Branch: codex/september-workflow.
