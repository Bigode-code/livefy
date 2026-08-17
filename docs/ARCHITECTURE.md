# Architecture

Livefy is organized into Control Center, Manifest V3 Chrome Extension, and Windows Native Media Runtime layers. The current repository implements the Control Center simulation shell and domain-facing UI foundation. Extension observation, TikTok calibration, native media, virtual camera registration, persistence, authenticated IPC, and real external adapters remain future implementation work.

Production data flows from specialized DOM observers through `TikTokLiveManagerAdapter`, normalized domain events, and the shared event bus. Mutating actions pass through one serialized queue with priority, deduplication, cooldown, timeout, retry, confirmation, and cancellation. Simulation must publish the same domain events and invoke the same engines.

The localhost IPC protocol will be versioned, authenticated, schema validated, heartbeat monitored, and bound only to loopback. Secrets live in OS-backed storage and are redacted before logging or export.
