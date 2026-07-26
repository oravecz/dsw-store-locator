# DSW Activations

A mobile-first progressive web app for finding DSW stores and tracking campaign
issues in the field. The app is designed for GitHub Pages and works offline after
the first successful visit.

## What it does

- Starts with a campaign selector and includes the **35th Birthday** campaign.
- Adds and deletes activation campaigns with persisted titles and start dates.
- Selects today’s activation or the nearest upcoming one when the app opens.
- Groups campaigns more than seven days old under a newest-first archive.
- Searches every store field with partial matches ranked ahead of fuzzy matches.
- Ranks partial matches by store number, ZIP, mall name, then address.
- Shows complete store details and a Google Maps directions link.
- Lists the five closest stores using precomputed geographic coordinates.
- Adds, edits, resolves, reopens, and deletes campaign issues on the current device.
- Filters stores by one or more prior “What needs attention” values.
- Copies the filtered stores and their issue details as tab-separated clipboard data.
- Suggests prior attention values during issue entry to reduce duplicates.
- Installs as a PWA and caches the full store directory for offline use.
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
npm install
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
