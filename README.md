# AHS time-study helper, September 24–30, 2026

Local release candidate. Not yet published. The production hostname currently returns NXDOMAIN. This version is tied to the exact current AHS attachment, DHCS 5293 revised 05/2026; a future study needs its official form checked before dates change.

## Colleague workflow

1. Enter provider details once.
2. Optionally type dated shifts. Review the preview, then explicitly apply them as draft patient-care hours. Overnight time is split at midnight and limited to the study window. Alternatively enter daily activity hours directly.
3. Review all seven days. Activity hours must match actual paid hours. Paid leave uses code 00010; unpaid days require an explicit action. Other activity codes and up to three cost-center splits remain available.
4. Download the filled, unsigned official PDF. Review it, sign using the AHS DocuSign instructions, obtain supervisor/reviewer approval as required, and attach the signed PDF to an email to PNPPTimeStudies. Email buttons only prepare a draft.

The current form has shared identity fields and a new hours-mismatch justification field. The old app used different field names and silently ignored failures. This exporter fails visibly on a required missing field, leaves both official signature fields untouched, and crosses out explicitly unpaid days.

## Privacy and persistence

No server, account, external parser, calendar token, analytics or sending relay is used. PDF generation occurs in the browser with a locally bundled, pinned pdf-lib 1.17.1. The existing external calendar and sending controls were removed because they were unconfigured or introduced unnecessary dependencies. Entries are saved in localStorage per study. They do not sync between devices. Clear this device removes app drafts and legacy saved signatures. The colleague link contains only the study date.

Old signatures and previous-period hours are never automatically reused. Opening email services hands draft text to the selected service. Patient data is not needed.

## Validation completed

18 automated regression/integration tests pass via `npm test`, including actual PDF generation and reopened fields. Chrome walkthrough verified entry, shift preview, seven-day review, persistence, PDF download, and phone layout at 390px. Sample PDF canonical fields and 31 related widgets agree, appearances are present, and employee/supervisor signature fields remain blank. Pages 4, 6 and 17 were visually inspected. No real time-study submission or outbound email was sent.

## Release remaining

User approval is required before publishing under the standing `/Users/michaelmote/AGENTS.md` rule: “Site deploys ... require explicit confirmation in the same session.”

After approval: publish this candidate to `mikedmote52/timestudy` main (GitHub Pages root), restore the missing Cloudflare DNS CNAME `timestudy` to `mikedmote52.github.io` with DNS-only handling appropriate for GitHub Pages, verify domain ownership/certificate and HTTPS, then repeat a fresh synthetic end-to-end download on the public URL. Do not send colleague emails without a separate send instruction. DNS account access has not yet been verified.

The local preview is served at http://127.0.0.1:8769/ while this session's server is running. Source base: 6695a47b7351f5032e3ed5cb09d8d02c402d6f2f. Branch: codex/september-workflow.
