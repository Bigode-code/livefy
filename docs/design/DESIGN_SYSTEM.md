# Livefy Design System

Livefy is a calm, precise operations environment. It uses cool neutral surfaces with one blue interaction accent. Green, amber, and red are restricted to semantic status.

Tokens live in `src/styles.css`. Spacing is a 2–64 px scale. Radius tokens are 7, 10, and 14 px for controls and surfaces, with circles used only for identity or state. Light mode uses an off-white workspace and white content surfaces. Dark mode uses charcoal base and elevated graphite surfaces, never pure black.

Typography roles are page title (28/700), section title (15/650), card title (18/650), body (14/400), secondary body (13/400), label (12/650), caption (11/500), metric (27/700), and diagnostic (system monospace when required).

Canonical components: Button, IconButton, Status, PageHeader, Section, Metric, TextField, SelectField, Switch, Search, EmptyState, Skeleton, InlineLoader, table, segmented control, and activity row. The internal `/#components` route exercises field and state failures.

The shell uses a 52 px toolbar, 224 px sidebar, constrained readable content, and wide variants for control/data screens. At 820 px the sidebar becomes an overlay. At 520 px metrics and operator actions stack.
