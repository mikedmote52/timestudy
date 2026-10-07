# AHS time-study helper

Public app: https://mikedmote52.github.io/timestudy/?study=2026-09-24

Independent helper for the September 24–30, 2026 non-physician (Non-UC) study. Current AHS DHCS5293 template: May2026 revision,19pages. The October7 supplied copy is byte-identical to the bundled template.

## Colleague flow

1. Open the public link from a text or email, preferably in Safari or Chrome.
2. Use Open QGenda to reach https://app.qgenda.com/UserSettings/CalendarConnections. Sign in, copy Your Subscription URL, return to the app and paste it.
3. Prepare the week. The relay fetches the personal calendar. Scheduled hours, Pacific dates, overnight splits, explicit profile fields and activity/cost-center metadata fill automatically. Add missing details or import a previous completed PDF. A missing/expired historical calendar is not interpreted as an exemption.
4. Review actual paid time and exceptions. The paid-leave shortcut updates selected dates under current-form code00010 without replacing worked activities. Ambiguous leave never silently becomes patient care. Confirm all7days; select or write the hours-variance reason if needed.
5. Download the unsigned filledPDF, review it, save to Files/Downloads. Supported mobile browsers can also use the native file share sheet. Editing a draft invalidates old PDF links.
6. Open DocuSign, sign in with AHS credentials, Start > Sign a Document > Upload, choose the saved file, add Signature and Date Signed on page17. Arrange supervisor/reviewer signature and return the signed form to PNPPTimeStudies. The app does not upload into DocuSign, sign, attach to email, or submit automatically.

The AHS October reminder also accepts Adobe digital signatures with unique timestamps and wet blue ink. Paper submissions need a color scan emailed plus the original sent to QIC21007, Reimbursement Department. Paid leave still requires a study; no scheduled work and no paid leave means no submission per the reminder. Current-form paid-leave code00010 supersedes the older FAQ’s00008. The reminder’s December31 training deadline does not erase the form’s training attestation.

## Privacy and scope

No accounts in this helper. Provider details and hours stay in this browser’s local draft; clearing the device removes them. Personal QGenda links travel through the MoteOps calendar relay, are cleared after successful import, and are not persisted or shared. Colleague SMS/email/native-share actions include only generic text and the public URL. Each colleague authenticates to QGenda and AHS DocuSign independently. No patient information is needed.

Known Highland ED direct-care shifts reuse17013 from a prior April2026 form. This historical setting is explicitly not independently reverified. Unknown workplaces, including unresolved FST labels, are not inferred. No workplace questionnaire is shown. Missing codes allow only a marked coordinator-review draft with a warning cover before signing; nonpatient work uses its supplied home code. Previous explicit codes/legacy selections are preserved.

## Verification and deployment

50 automated checks cover personal-link isolation, safe sharing, clipboard fallback, parsing/time zones/overnight boundaries, recurrence, leave, changed totals, profile/PDF import, final-vs-draft exports, blank signatures and stale-download invalidation. Run npm ci and npm test. Synthetic browser import and PDF generation exercised at390px phone width. QGenda entry point reaches sign-in; relay is reachable and rejects non-QGenda hosts. A real colleague’s authenticated QGenda feed and AHS signing were not performed in the October session. Physical iPhone/Android share sheets were not exercised.

GitHub Pages serves main/root. Publish fast-forward only; verify build and live asset hashes. No external messages or real signatures are authorized by app deployment. The old timestudy.moteops.tech DNS is not repaired by this release.
