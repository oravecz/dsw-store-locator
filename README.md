# DSW Activations

A mobile-first progressive web app for finding DSW stores and tracking campaign
issues in the field. The app is designed for GitHub Pages and works offline after
the first successful visit.

## What it does

- Includes the **35th Birthday** campaign and automatically selects today’s
  activation or the nearest upcoming one when the app opens.
- Opens a dedicated Campaign Manager from the header to select the active
  campaign; add, edit, and delete campaigns; and review participating-store and
  open-issue counts.
- Groups campaigns more than seven days old under a newest-first archive.
- Uses a full-page Campaign Editor for campaign titles, start dates, and
  participating-store coverage, including partial-match filtering, bulk
  selection tools, and copying coverage from another campaign.
- Searches every store field with partial matches ranked ahead of fuzzy matches.
- Ranks partial matches by Store identifier, ZIP, mall name, then address.
- Shows complete store details and a Google Maps directions link.
- Lists the five closest stores using precomputed geographic coordinates.
- Stacks nearest-store selections with top back navigation and a mobile
  right-swipe-from-edge gesture.
- Adds, edits, resolves, reopens, and deletes campaign issues on the current device.
- Filters stores by one or more prior “What needs attention” values and
  remembered issue-status toggles that default to New and Reported.
- Copies filtered stores and issue details as a rich HTML table with a
  tab-separated plain-text fallback.
- Suggests prior attention values during issue entry to reduce duplicates.
- Installs as a PWA and caches the full store directory for offline use.
- Prevents double-tap, pinch, and form-focus zoom in the installed mobile app.
- Uses safe-area-aware layouts and controls on mobile devices.
- Detects deployed releases automatically, activates them immediately, and
  refreshes an open app after the new worker takes control.
- Uses the supplied DSW wordmark for standard, maskable, and Apple touch icons.

## Data notes

The app includes 493 stores from `DSW US Store Directory (2).xlsx`, dated
May 27, 2026. Street-level coordinates were added for 409 stores with the U.S.
Census Geocoder. The remaining 84 stores use representative coordinates from
the 2025 Census ZIP Code Tabulation Area Gazetteer.

Issue records use browser local storage. They are not synchronized between
devices and are cleared if the user removes site data.

## Local development

```bash
npm ci
npm run dev
```

Run the verification suite and production build:

```bash
npm test
npm run build
```

## Deployment

Every push to `main` runs the test suite, builds the PWA, and deploys `dist/`
through the GitHub Pages Actions workflow. The Vite base path is configured for
`https://oravecz.github.io/dsw-store-locator/`.
