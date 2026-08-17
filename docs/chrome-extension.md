# Livefy Live Bridge

## Architecture

The Chrome extension never stores the user's Livefy password, Supabase session or administrative key.

1. An authenticated workspace member generates a 16-character one-time code in Livefy Settings.
2. The browser exchanges the code for a random device credential. Pairing codes expire after 10 minutes and are stored only as SHA-256 hashes.
3. The extension queues captured events locally and sends batches over HTTPS to `/api/extension`.
4. PostgreSQL verifies the device credential hash before accepting heartbeat or event batches.
5. Revoking the device in Livefy immediately prevents further ingestion.

Captured data is restricted to visible public TikTok LIVE comments, visible product cards, audience count and page type/host. The content script does not read cookies, private messages, passwords, payment data, form inputs, screenshots, camera or microphone.

## Install for testing

1. Apply `supabase/migrations/20260817202621_chrome_extension_bridge.sql` to the production Supabase project.
2. Deploy the current repository so `/api/extension` is available.
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Select **Load unpacked** and choose the repository's `extension` directory.
6. Sign in to Livefy and open **Settings → Chrome extension**.
7. Generate a pairing code, open the extension, accept the disclosure and enter the code.
8. Open a TikTok LIVE page. The extension status should become connected and Diagnostics should show the device heartbeat.

## Chrome Web Store submission

- Upload the release ZIP generated from the `extension` directory.
- Use `https://livefy-tau.vercel.app/privacy-extension.html` as the public privacy-policy URL.
- Declare the single purpose as connecting visible TikTok LIVE operational data to the user's Livefy workspace.
- Disclose website content, user activity, authentication/device identifier and public user-generated content handled by the extension.
- Explain the required `storage`, `alarms` and TikTok host permissions. Optional host access is requested only when a user configures a trusted self-hosted Livefy endpoint.
- Provide an extension icon, screenshots of the popup in paired/unpaired states and a screenshot of the connected-device panel.
- Do not claim the extension sends comments or controls TikTok; the current version is read-only capture.

The extension contains no remote executable code. The only remote asset used in its interface is the official Livefy SVG logo; all behavior is contained in the submitted package.
