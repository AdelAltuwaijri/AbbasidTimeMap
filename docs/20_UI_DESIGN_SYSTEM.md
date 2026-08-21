# UI Design System

## Visual identity
A cinematic historical interface inspired by Abbasid manuscripts, brass/gold accents, dark ink, parchment, astronomy/geometric ornament, while remaining modern and readable.

## Principles
- map is visually dominant
- decoration must never obscure data
- Arabic-first typography
- high information density on desktop, progressive simplification on mobile
- event categories have consistent visual semantics

## Color roles
Define semantic tokens rather than hard-coded component colors:
- background-primary
- background-elevated
- gold-primary
- text-primary
- text-muted
- border-subtle
- status-high-confidence
- status-disputed
- event-battle
- event-science
- event-political

Exact values should be centralized in design tokens.

## Typography
- Arabic display font for titles only if legible
- highly readable Arabic UI/body font
- Latin fallback for English/technical strings
- Bidi-aware components for mixed text

## Core components
- AppHeader
- TimelineBar
- YearSelector
- HistoricalMap
- LayerPanel
- MapLegend
- EventMarker
- EventDrawer
- EntityChip
- SourceList
- ConfidenceBadge
- SearchCommand
- JourneyCard
- PlaybackControls

## Event marker semantics
Marker shape/icon identifies category; color must not be the only differentiator.

## Event experience sections

M-04 uses one conditional reading flow rather than tabs. Empty historical sections
are omitted, so a tab never leads to an invented placeholder or empty panel. The
order is: header/date metadata, what happened, causes, consequences, places,
related people/states, sources, then confidence. Source cards are visually distinct
from historical narrative and expose bibliographic/citation/support fields without
showing invalid links. Confidence and disputed status use text and semantics, not
color alone.

Relationship machine codes are retained in the API but are not rendered as Arabic
labels without an approved localization. AI-specific actions remain visually and
semantically separate from verified source content when a later package enables
them.

## Responsive strategy
Desktop: map + side panels.
Tablet: collapsible side panels.
Mobile: full-screen map with a height-bounded, internally scrollable bottom sheet
for events and timeline optimized for touch. The sheet header and close control
remain available while long content scrolls.

## Motion
Use subtle motion for:
- year transitions
- marker emphasis
- boundary changes
- map focus
Avoid excessive cinematic animation during normal research use.
