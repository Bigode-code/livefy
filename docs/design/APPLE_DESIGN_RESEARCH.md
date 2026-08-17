# Apple Design Research

## Scope and source policy

This study extracts general interaction and layout principles from Apple's official Human Interface Guidelines, Design Resources, and public product pages. Livefy does not reproduce Apple assets, brand elements, copy, or proprietary fonts. The product uses an original visual language designed for a Windows-first operations console.

Official references reviewed: [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/), [Design Resources](https://developer.apple.com/design/resources/), [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Color](https://developer.apple.com/design/human-interface-guidelines/color), [Materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars), [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables), [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), [Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback), [Loading](https://developer.apple.com/design/human-interface-guidelines/loading), and [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility/).

## Layout observations

- Put navigation and frequent commands in stable, distinct layers. Let content remain the visual subject.
- Preserve a clear reading order and group related items with negative space, surface shifts, or separators.
- Keep essential status visible; move secondary detail into inspectors and deeper views rather than crowding the primary surface.
- Adapt window layouts, not merely page width. A sidebar can collapse, grids can reduce columns, and tables can intentionally scroll.

## Spacing principles

- Use a small deterministic scale. Livefy uses 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, and 64 px.
- Spacing communicates hierarchy: tighter within a unit, broader between units. Separators reinforce structure only when space alone is insufficient.
- Keep control rows compact enough for scanning while retaining comfortable pointer targets.

## Typography hierarchy

- Typography should establish information priority before color or decoration.
- Use platform system fonts without distributing proprietary Apple fonts. Livefy uses the native system stack with Segoe UI on Windows.
- Titles use controlled weight and tight tracking. Labels and metadata are quieter but remain legible. Monospace is reserved for diagnostics where column alignment matters.
- Avoid truncation when wrapping preserves meaning; use ellipsis for bounded table identities with an accessible full value.

## Visual density and control sizing

- Desktop software can expose more information with fewer navigation levels, but density must remain comfortable.
- Livefy targets 34–38 px desktop controls and larger compound row targets. Icon-only controls retain a 34 px hit region.
- Expected input length determines width. Forms use compact rows only for switches and vertical labels for text entry.

## Radius, border, shadow, and material strategy

- Five radii cover small controls, fields, content groups, sheets, and circular elements. Large radii are not used indiscriminately.
- Borders are quiet separators rather than container outlines. Surface contrast and spacing do most grouping.
- Shadows are reserved for navigation overlays, menus, and sheets. Static content uses no elevation beyond a very subtle surface edge.
- Translucent material belongs to the functional layer: toolbar, sidebar, and overlays. Content surfaces remain opaque and calm. Contrast must survive reduced transparency.

## Navigation hierarchy

- A leading sidebar exposes a shallow hierarchy of major work areas. Groups use short, quiet labels.
- Selection combines text contrast, a subtle surface, and a narrow accent marker so it never relies on color alone.
- The toolbar includes only global runtime state and the most important contextual command.

## Form design

- Text controls use labels above fields, optional descriptions, and inline errors below. Focus remains highly visible.
- Settings rows use a single label/description block paired with one control.
- Secrets are masked after storage, never echoed into logs or exports, and entered only in explicit security-sensitive flows.

## Interaction feedback and motion

- Feedback intensity matches consequence: passive status for health, inline error for correctable input, confirmation for destructive actions.
- Loading preserves spatial context through skeletons; determinate operations use progress when duration is known.
- Motion is brief and purposeful. It explains selection, pressed state, or layer transition. `prefers-reduced-motion` disables nonessential animation.

## Responsive patterns

- At narrower windows the sidebar becomes a dismissible overlay, multi-column content stacks, and toolbar detail condenses.
- Data tables preserve columns via intentional local horizontal scrolling rather than causing document overflow.
- Long strings are tested explicitly in controls and data identities.

## Accessibility principles

- Semantic landmarks, native controls, programmatic labels, logical tab order, and visible focus are baseline requirements.
- Status always includes a text label or symbol; color is supplementary.
- Light and dark palettes preserve semantic hierarchy. Text scaling and reflow are preferred over indiscriminate clipping.
