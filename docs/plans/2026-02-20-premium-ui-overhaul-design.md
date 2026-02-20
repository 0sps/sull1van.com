# Design Document: Premium UI Overhaul (Celestial Edition)

**Date**: 2026-02-20
**Topic**: UI Refinement for /dates/app.html
**Status**: Approved

## Overview
Transform the current iOS-style "Contacts" app into a high-end, atmospheric "Celestial Tracker." The goal is to move away from generic AI-generated aesthetics (Inter font, flat blurs) towards a distinctive, premium interface that feels both futuristic and organic.

## Aesthetic Direction: "Orbital Elegance"
- **Tone**: Luxury/Refined + Celestial/Atmospheric.
- **Color Palette**: Deep Midnight Navy (#000814), Golden Sun (#ffcc33), and high-saturation reflective glass elements.
- **Key Experience**: The app should feel like a physical device made of polished obsidian and glass, floating in space.

## Design Details

### 1. Typography & Hierarchy
- **Primary Header Font**: `Outfit` (via Google Fonts). Bold, geometric, and modern.
- **Body & Metadata Font**: `Plus Jakarta Sans`. Clean, readable, with enough character to feel premium.
- **Implementation**: Replace all `@font-face` and variable definitions in `:root`.

### 2. Atmospheric Backgrounds (The "Void")
- **Nebula Layer**: A new background div fixed behind the grain. Uses a large, slow-moving radial gradient with `blur(80px)` and low opacity (approx 0.05).
- **Grain Enhancement**: Change `mix-blend-mode` to `color-dodge` or `overlay` and reduce opacity to `0.04-0.06` for a subtle high-ISO film texture.
- **Solar Flare**: Synchronize the sun's glow with a subtle `box-shadow` on high-interest cards when they are in viewport.

### 3. Glassmorphism 2.0 (The "Hardware")
- **Reflective Borders**: 1px borders using `linear-gradient` (to bottom right, white at 0.15 to transparent) to simulate edge light.
- **Vibrant Blur**: Increase `saturate(180%)` on all `backdrop-filter` properties to prevent colors from feeling "muddy."
- **Holographic Finish**: Enhance `holographic-card` with an actual `noise` texture overlay and a `linear-gradient` that shifts based on hover/tilt (simulated for mobile).

### 4. Motion & Micro-interactions
- **Solar View Transition**: When switching tabs (Dates -> Stats), the current view slides out on a 3D axis (`rotateY(5deg) scale(0.95)`) and fades. The new view enters from the opposite side.
- **Pulse States**: Low-interest entries (Status 1) will have a subtle "fading out" opacity, while high-interest entries pulse with a warm golden inner glow.

## Technical Tasks
1. Import `Outfit` and `Plus Jakarta Sans` in `<head>`.
2. Update `:root` variables and global font settings.
3. Refine `.bg-layer` and `.grain` CSS; add `.nebula` layer.
4. Rewire card CSS for reflective borders and saturation.
5. Implement CSS keyframes for the "Solar Switch" animation.
6. (Optional) Audit the `switchTab` JS function to trigger the new animations.

## Success Criteria
- No use of generic system fonts.
- Interface feels "expensive" and custom-designed.
- High visual consistency between user-added content and the celestial background.
