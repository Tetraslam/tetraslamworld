# V5 release

## Booking and navigation contract

The homepage contact row and existing booking command open the same Cal.com event (`tetraslam/30min`) in Cal's native modal. The installed 1.5.3 React SDK supplies namespace initialization, modal lifecycle, and theme configuration. Load it on request, coalesce concurrent opens, and close the command palette before opening the booking modal. Use the SDK's preload/reopen path: plain repeated modal calls were observed retaining multiple hidden frames. The ordinary booking link remains usable without JavaScript or with a modifier-click; a failed module load falls back to the booking page. Cal owns availability and booking submission; verification must not create an appointment.

The search button displays a small platform-specific keyboard hint. Existing keyboard behavior remains authoritative. Verify normal and palette booking entry points, dismissal/reopening, mobile layout, theme, and keyboard search in a production build and on the live deployment.

## Release boundary

Merge the reviewed branch into `rewrite`, the branch of the current production deployment. Vercel owns frontend rollout; the previously deployed additive Convex functions remain the backend. Verify production's backend URL and admin configuration before merging, then check the production deployment and public routes. Preserve all existing content and make no live test submissions.

## Pre-release evidence

- Vercel's project API confirms `rewrite` is the production branch. Production uses `valuable-mandrill-918.convex.cloud`, matching the updated backend; the admin environment variable is configured.
- Production build and all 43 tests pass. Changed-file lint has no errors; existing stylesheet specificity warnings remain.
- Chrome exercised the contact link, Ctrl+K, the booking command, close/reopen, light/dark themes, and a 390px viewport. Repeated opening retained exactly one Cal iframe, and the command palette closed before the calendar appeared. No horizontal overflow was observed.
- Cal loaded the correct owner and 30-minute event, but reported no availability for September/October 2026. Appointment creation remains intentionally untested.
