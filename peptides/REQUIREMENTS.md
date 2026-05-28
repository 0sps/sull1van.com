# PeptideKit+ Labs UI Port Requirements

## Source Design System

Source: `/labs/index.html`

PeptideKit+ should borrow the Labs interface language:

- Dark iOS glass UI over an atmospheric sky background.
- `Outfit` for headings and compact labels, `Plus Jakarta Sans` for body text.
- Fixed floating top bar with rounded glass, blur, soft border, and high contrast text.
- OLED base palette: near-black blue background, white primary text, translucent secondary text.
- Semantic accents from Labs: blue, green, red, amber.
- Glass cards: translucent gradient surfaces, 1px white borders, brighter top border, deep soft shadow, 20px radius.
- Background atmosphere: nebula gradients, vignette, stars, moon, sun glow, grain texture.
- Interactions: color, opacity, border, and shadow changes only for buttons. Button hover states must not move, lift, scale, or translate.
- Accessibility: visible focus states, 44px minimum touch targets, semantic labels, reduced-motion support.

## PeptideKit+ Functional Surface

The `/peptides/index.html` app must retain these existing behaviors:

- Google/Firebase authentication gate restricted to `sspsful@gmail.com`.
- Local state cache with Firebase sync for protocols, logs, labs, and journal entries.
- Dashboard with greeting, active protocol count, remaining doses, adherence, agenda, fast paths, active runway, rotation snapshot, PK level, and recent activity.
- Protocol vault with add, edit, delete, presets, concentration math, dose unit switching, syringe configuration, frequency, time, duration, and start date.
- Dose math that recalculates draw units live from peptide mass, water volume, target dose, unit, and syringe size.
- Anatomical injection site mapper with front, back, and face views, selectable sites, history, and site logging.
- Calendar view with half-life canvas chart, scrub label, time window controls, mg/mcg unit controls, and monthly log dots.
- Analytics view with logs, labs, and journal tabs, add forms, edit modals, delete confirmations, and live dashboard updates.
- Floating quick action sheet for logging dose, adding protocol, recording symptoms, and updating weight.
- Toast feedback and modal focus management.
- Hash navigation across `#dashboard`, `#protocols`, `#calendar`, and `#analytics`.

## Implementation Notes

- Keep the current PeptideKit+ JavaScript and data model as the behavior source of truth.
- Port the Labs design by overriding the visual layer in `index.html`.
- Use inline SVG icons already present in the app. Avoid emoji as structural icons.
- Preserve mobile behavior and prevent horizontal overflow.
- Respect `prefers-reduced-motion`.
