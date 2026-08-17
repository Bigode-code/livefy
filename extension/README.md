# Livefy Live Bridge

Manifest V3 extension that captures only visible TikTok LIVE operational data after explicit consent and sends it to a paired Livefy workspace.

## Local installation

1. Apply the `chrome_extension_bridge` Supabase migration.
2. Open `chrome://extensions` and enable Developer mode.
3. Choose **Load unpacked** and select this `extension` directory.
4. In Livefy, open Settings → Chrome extension and generate a pairing code.
5. Open the extension, accept the disclosure, enter the code and connect.
6. Click the Livefy toolbar icon. Chrome opens the persistent controller beside the current page.

## Side panel controller

The controller uses Chrome's native Side Panel API, so it occupies browser space beside TikTok instead of covering the page. It provides a real session timer, capture controls, viewer/comment/product counters, recent activity, detected products, visible comments and security status. Ending monitoring stops Livefy capture; it does not end the TikTok broadcast.

## Captured data

- Public visible LIVE comments and usernames.
- Visible product names and prices.
- Visible audience count.
- TikTok page host/type and connection health.

The extension does not read cookies, passwords, private messages, form inputs, screenshots, microphone, camera or browsing activity outside TikTok.

## Store publication

The package is self-contained and does not execute remote code. Before submission, add the Chrome Web Store listing assets, complete the data-use disclosure and upload a ZIP containing this directory.
