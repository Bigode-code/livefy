# Technical Risks

1. TikTok DOM instability: mitigate with centralized versioned selectors, confidence scoring, diagnostics, and operator-assisted calibration.
2. Browser mutation safety: serialize all mutation commands and require DOM confirmation.
3. Windows virtual camera complexity: prototype against official Media Foundation APIs behind a platform abstraction and validate packaging/registration early.
4. Long-running reliability: add heartbeats, bounded queues, watchdogs, persistence checkpoints, and deterministic recovery tests.
5. Secret exposure: isolate credentials in native storage, use typed redaction, and prohibit them in DOM, logs, exports, and source.
6. Visual regression entropy: freeze simulation data, disable animation during capture, and review snapshot changes at target window sizes.
