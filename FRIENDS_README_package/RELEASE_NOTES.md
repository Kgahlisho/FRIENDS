# Release notes

## v1.0.0 "Braam Night+": final release (November 2026)

This is the first full release since the prototype. It turns the working prototype into a complete ticketing system for guests and door staff, and adds security, offline support, notifications and automated checks.

**Where we started (prototype):** user authentication, event discovery, ticket purchase, proof-of-payment submission, live booking status for customers and admins, QR-code generation and scanning, profile management and admin payment verification. Still open at that point: security management, event search and filtering, and admin create/read/update/delete.

### Innovative features added in this version

| # | Innovative feature | What it does | Why it matters |
|---|---|---|---|
| 1 | **Guided first-ticket experience** | A 9-step guide after the first log-in, one-time coach-mark bubbles that point at what to tap, a guided first payment in 5 steps, and a replay option in Help. | Paying by EFT and uploading proof is the hardest part for a first-time buyer. We teach it on the real screens instead of in a manual. |
| 2 | **Trackable EFT payment flow** | Tickets are held for 24 hours with a countdown. Each booking gets a unique reference with copy buttons, proof can be uploaded from the camera, photos or files, and a status timeline shows reserved, proof received, team verifying and QR ready. Guests can set reminders if they pay later. | Fixes the "no certainty" problem. The guest always knows where their payment is. |
| 3 | **"Proof needs a fix" recovery** | Staff reject a proof with a reason and a message. The guest sees exactly what to fix, the tickets stay held, and they re-upload without paying again. | Rejections no longer mean lost sales or long WhatsApp chains. |
| 4 | **Staff approvals queue and door mode** | An approvals queue (oldest first) with a proof checklist (amount, reference, paid within hold), a door dashboard with live check-in counts, a guest list with manual ticket ID entry, and a QR scanner with five clear results: valid, not a valid ticket, wrong event, not paid yet and already scanned. | Replaces checking proofs by hand and guest lists on paper. |
| 5 | **Offline-first tickets** | Approved tickets and recent events open without internet, and the app shows when the phone is offline. | Signal at venues is unreliable. The QR must work at the door. |
| 6 | **Role-based security with automated tests** | Firestore security rules separate guest and admin accounts. 53 automated tests check the rules on the Firebase emulator and run in CI. | Security is enforced by the database, not just by hiding buttons, and it is tested on every change. |
| 7 | **Smart notifications** | Push notifications when a payment is approved or needs a fix, even when the app is closed, plus reminders for guests who chose to pay later. | Guests do not have to keep checking the app. |
| 8 | **Social ticketing** | Send a ticket to a friend with a WhatsApp link (with pending and cancel states), release a ticket to the waitlist, invite friends and see who is going. | Plans change. Tickets move to people instead of being wasted. |
| 9 | **Access codes** | Staff create discount or guest-list codes that guests enter when they book. | Gives the organisation control over offers and guest lists. |
| 10 | **Searchable in-app help** | A help centre with step-by-step answers (paying by EFT, refunds, at the door) and a replay option for the guide. | Support questions are answered where the user is stuck. |

### New features since the prototype

**Accounts and authentication**
- Forgot password with a reset link sent by email.
- Email verification through Firebase Authentication, with a Verified status in the profile.
- Clear log-out with a chance to cancel.
- Interests (sub-brands) chosen at sign-up.

**Events and discovery**
- Search with recent searches.
- Filters: when, price, sub-brand, free events only and sort order.
- Sub-brand pages for &Music, &Talk, &Fun and &Food, with follow.
- Lineup with reminders, event location map and route to the venue.
- Past events with photo and video galleries, venue profile and saved events.

**Booking**
- Ticket selection (up to 4 per person) with an all-in price, fees and VAT included.
- Promo and access codes.
- Review screen with a full price breakdown.

**Tickets**
- My tickets with Upcoming, Pending and Past views.
- QR ticket detail, send to a friend, and a "Can't make it?" flow (send, release or ask for a refund).
- Purchases and receipts (PDF or email copy), and a post-event rating.

**Community and account**
- Friends (requests, invites, who is going) and a host-an-event enquiry with a status tracker.
- Profile and settings, refund bank details, notification preferences and privacy and security.

**Website (shared backend)**
- Venue hire pages with a transparent rate card and a call to action.
- Customer dashboard (tickets, upcoming events) and admin dashboard (sales, revenue, events, gallery, website content, tickets and users).

### Improvements
- New visual identity and component system, **Braam Night+**: bold type, a dark theme and a colour for each sub-brand.
- Usability changes after the presentation feedback: fewer pop-ups (prompts appear once, guide steps can be skipped, guided help can be hidden), one optional notification prompt and long tasks split into short steps.
- &FRIENDS logo replaces the default Expo icon.

### Bug fixes
- Fixed Expo Go notification problems, `GO_BACK` navigation errors and listener errors.
- Fixed a redirect loop when logging in before finishing onboarding.
- Fixed the app hanging on the splash screen when reopened.

### DevOps and quality
- Four GitHub Actions workflows: type check and unit tests on every pull request, Firestore security-rules tests, an installable Android APK build and an iOS simulator build.
- Azure Pipelines (`azure-pipelines.yml`) tests the code and builds the APK. Run `#20261018.1` passed 100% of tests and published the APK.
- Jest unit tests for pricing, dates, filters, validation, tickets, help and alerts.
- 91 work items planned in Azure Boards across seven two-week sprints (21 July to 26 October 2026).

### Known limitations
- Payments are made by EFT and verified by staff. There is no card payment gateway.
- The app is in English. Other languages are shown as "coming soon".
- The installable build is the Android APK. iOS is built as a simulator build.
