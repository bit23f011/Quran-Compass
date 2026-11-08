# Surah Compass 3.2.1

A Quran discovery, reading and learning app built with plain HTML, CSS and JavaScript. A stationary 114-Surah dial with a rotating ornamental clock hand, a reader-facing Quran catalogue with a tooled cover and curved page turns, and dedicated Reader, Journey and Settings pages. Warm parchment/taupe and midnight blue themes, readable typography, Islamic geometric ornament, and no gradients or generated imagery. The supplied blue/gold background belongs only to the home content below the solid sticky navbar. The supplied Quran calligraphy is used unchanged in the logo, favicon, installed-app icons and loading indicators.

## Open the app

On Windows, double-click **START-OFFLINE.bat**, or run:

```sh
npm run dev
```

Open **http://localhost:3000**. No npm install is needed. Node 20+ runs the server with built-in modules and the app has no dependencies. Opening **index.html** directly also works for the basic app; localhost/HTTPS provides the most reliable offline cache, audio packs, browser storage, encryption and installation support.

## Features

### Discover and explore

- A smaller ornamental clock hand rotates from the central spin button over a stationary SVG dial: 11 rotations over 6.8 seconds with smooth deceleration. Light/dark themes and reduced-motion support.
- Optional quiet clock ticks and completion chime, with one saved sound toggle. Spoken Surah-name announcements have been removed. Scholar audio translations remain in the reader.
- The Surahs tab presents a Quran catalogue without a stand. Mouse movement gently tilts the book. Click to open the Bismillah introduction, then browse two-page spreads: Surah 1 on the right and 2 on the left, then 3 right and 4 left, through 113 and 114. Forward turns move from left to right in either interface language, with sixteen bent strips forming the curl. Complete directory details use growing pages instead of nested scrolling. Click the left page to advance and the right page to go back; Enter/Space on a focused page follows the same direction. Its explicit Open Surah button opens the reader. Use previous/next, direct Surah jump, keyboard or swipe navigation.
- A long red ribbon begins in the opening gutter. Drag it above the book to park, then onto either leaf to save that exact Surah and position. It appears on its saved spread and rests in the dock elsewhere. Simple clicks leave the ribbon unchanged. Equivalent save/remove/jump controls support keyboard and touch use. The saved bookmark travels in local/encrypted backups. These pages are a Surah directory; actual Quran verses appear in the dedicated reader when authentic text has been loaded.
- A persistent shuffled bag gives each of the 114 Surahs one turn per cycle. Selection is reserved before animation and Web Locks coordinate simultaneous tabs on HTTPS/localhost.
- Advanced spin filters: revelation classification, short/medium/long Surahs, Juz and reading status. Changing a filter never restarts a partly finished global cycle. A depleted filter asks you to change it; after all 114, the next eligible spin begins a fresh cycle.
- Surah search, Arabic/English/Urdu ayah search, topic aliases such as Sabr/صبر, popular topic chips, Juz/revelation/status filters and sorting.
- Surah metadata, study introductions, theme tags, reflection prompts and trusted Quran.com/tafsir links. Conventional revelation classifications/order can vary between scholarly catalogues.

### Read, listen and memorize

- A dedicated reader with Surah sidebar, last-read resume, authentic Arabic text, multilingual language/scholar selectors, ayah navigation, larger font controls and distraction-free/full-screen mode.
- Pages mode flows complete authentic ayahs together with numbered markers, previous/next controls and an ayah jump to its containing page. Page divisions are calculated for this reader, rather than copied from a particular printed Mushaf edition. Ayah cards remain available. Translation, tafsir and ayah actions remain accessible in Pages mode.
- Explicit read marks and completed-Surah status. Opening or listening to a Surah does not count it as read.
- Ayah-level bookmarks, collections, personal notes, copying, grouped in-reader tafsir and online commentary references.
- 25 configured reciters from EveryAyah, including Alafasy, Husary, Minshawi, Abdul Basit, Sudais, Shuraym, Maher and Ghamdi: ayah playback, previous/next, seek, rate and following the current ayah.
- Separate sourced spoken-translation mode with English/Urdu candidates; accepted translated speech and its downloaded audio remain distinct from recitation.
- Optional per-Surah audio downloads with progress/cancel, resumable partial packs, offline playback and cached-pack removal. Audio starts only after a user action. Actual source downloads require internet and a source that permits cross-origin caching.
- Mobile home shows the spinner first. The reader has a fixed compact Play/Pause transport, with optional audio settings, positioned above the bottom navigation.
- Hifz mode: choose an ayah range, hide/reveal its text, repeat a passage, mark memorized ayahs and schedule revision.

### Your journey

- Reading progress and memorization remain separate from wheel discovery.
- Resume card, daily ayah target, seven-day reading chart, completed/read/memorized counts and an estimated completion plan.
- Notes/collections, reflection export, revision due dates, recurring revision intervals and manual reviewed marks.
- English/Urdu interface with RTL layout. Quran translations are separate from interface language; editorial study introductions currently remain English.
- Optional local reminder banner while the app is open. This static app does not send background notifications when closed.
- Full progress backup/restore, including the spin cycle, favourites, notes, reading/hifz state, plan and reader preferences. Large Quran/audio packs and cloud credentials are excluded.
- Password-protected local backups use AES-GCM with PBKDF2-SHA256 (250,000 iterations), a fresh salt and nonce. Passwords are never uploaded or saved; a forgotten password cannot be recovered.
- Optional Supabase email-link sign-in and private manual cloud backup/restore, described below. The default app works without accounts.
- Installable manifest, offline service worker, visible Install app control and storage/audio pack manager. Chrome/Edge can offer a native install prompt; Safari and other browsers receive their relevant install instructions. The control disappears in installed display mode.

## Quran text: current status

**All 114 chapter records, 6,236-ayah counts, study introductions and references are included. Complete Arabic verses and English/Urdu translations are not yet bundled.** The authoring environment's network/automatic approval review failed even after the user authorized the public download. Live browser inspection of version 3.2 was also blocked by automatic review with an internal content-blocked error. Production interaction handlers, selection, reading pages, ribbon dragging and install-state flows were checked locally; final browser visual verification remains incomplete. No Quranic or tafsir text was invented to fill the gap.

The reader also has a source-aware catalogue of 25 reciters, 20 translation editions across 13 languages, four tafsir references, and English/Urdu spoken-translation candidates. Explicit source discovery can add editions reported by the providers. Configured references remain marked unverified until actual provider checks succeed. Selected chapter/translation/commentary downloads are cached separately for offline reuse; spoken-translation audio files must also be downloaded before offline listening. Source availability and licensing are documented in **data/SOURCES.md**.

The app includes text-pack download/import workflows. To install authentic text once while online, use **Download reading pack** in the app or run:

```sh
npm run download-quran
```

The installer downloads the official `quran-json` npm data distribution, checks its SHA-512 integrity, checks all 114 chapters and 6,236 ayahs, compares Arabic between both editions and preserves source text verbatim. It never executes upstream code. It creates **data/quran.js**, **data/quran-pack.json** and upstream attribution. Rebuild and refresh afterward.

If you already have the original complete English and Urdu Quran JSON edition files, install them locally without network access:

```sh
node scripts/download-quran.mjs --english "C:/path/quran_en.json" --urdu "C:/path/quran_ur.json"
```

The combined **quran-pack.json** can also be imported inside the app and stored in IndexedDB. Full reading, text search, audio and hifz then work with that installed corpus. Quran text and audio are separate packs; download the audio you want before going offline. Retain upstream content attribution/license terms when distributing a populated bundle; see **data/SOURCES.md**. Live text/audio source access and cloud provider access could not be verified here.

## Deploy on Vercel

Import this folder as a Git project into Vercel. **vercel.json** selects **npm run build** and the **dist** output directory. No backend or environment variables are required for the default app.

```sh
npm run build
npm run check-assets
```

The build validates all JS and the Surah catalogue, publishes only the app assets and generates a content-based service-worker cache revision. The **dist** folder also works on another static host. On a hosted version, visit once and wait for **Offline ready** before disconnecting; install any text/audio packs you need.

## Optional account/cloud backup

Local file transfer already carries your progress between devices. To enable the optional account-backed cloud flow:

1. Create a Supabase project and run **cloud-setup.sql** in its SQL editor. It creates one backup per authenticated user with row-level security; anonymous users cannot access it.
2. Enable email-link authentication. Set the deployed app URL as the Auth Site URL and add the app URL and any localhost test URL to the allowed redirect URLs. Configure production email delivery as appropriate for your project.
3. Set these Vercel build environment variables and redeploy:

```text
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Only a **public anon/publishable key** belongs in the frontend. The build rejects a service-role JWT. For local configuration, edit **config.js** with the same public values.

Settings then offers email-link sign-in, **Back up to cloud**, **Load cloud backup**, and a review step before restoration replaces local progress. Cloud backup is manual: back up the active device before moving to another one. It does not coordinate simultaneous spins between different devices. The browser keeps the login session locally; session tokens never enter exported progress backups. Quran/audio packs remain local. The provider has not been configured or exercised against a live account in this workspace.

## Verification

```sh
npm test
```

Meaningful tests execute the production selection engine, storage, app handlers, reader/audio state, sync protocol and encryption with controlled DOM/network fixtures. They cover no-repeat cycles, every resume position, filtered subset depletion, concurrent tabs, Arabic normalization, Urdu/English switching, backup validation/rollback, offline-memory mode, actual WebCrypto round trips, corrupt/wrong-password backups, audio races/cancellation and sign-in token handling. Fixtures are test data, never a replacement Quran corpus.

## Privacy and conventions

No tracking or ads. Local progress is stored on the device, and clearing browser data removes it. Export a backup to preserve it. When storage writes are rejected, the current session continues in memory; those changes cannot survive closing the app.

Editorial introductions and prompts are navigation/study aids, not tafsir, Quran translations, religious rulings or sourced revelation-occasion reports. Tafsir links open the referenced commentary online. The random compass selection is for discovery and carries no predictive religious meaning.
