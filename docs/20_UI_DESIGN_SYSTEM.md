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

## Event drawer tabs
Recommended:
- Summary
- Details
- Impact
- Sources

AI-specific actions remain visually separate from verified source content.

## Responsive strategy
Desktop: map + side panels.
Tablet: collapsible side panels.
Mobile: full-screen map with bottom sheet for events and timeline optimized for touch.

## Motion
Use subtle motion for:
- year transitions
- marker emphasis
- boundary changes
- map focus
Avoid excessive cinematic animation during normal research use.
