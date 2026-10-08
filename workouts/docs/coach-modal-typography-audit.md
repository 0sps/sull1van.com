# Coach modal typography audit

October 8, 2026. Source audit of `app.html`, `css/coach.css`, and `css/coach-modal.css`, using `css/progression.css` as the reference. Browser rendering has not been verified.

## Findings

The modal stylesheet had 21 distinct font-size definitions, including two fluid expressions and mobile overrides. Sizes ranged from 9.6px to 73.6px at a 16px root size. Supporting labels frequently used 9.6px, 10.4px, or 11.2px. Three font families appeared: DM Sans, Space Mono, and Bebas Neue.

## Applied scale

The modal now uses five sizes from progression's scale:

| Role | Size | Examples |
| --- | --- | --- |
| Metadata | 14px | Captions, set labels, rep legend, target labels |
| Body and controls | 16px | Advice, action label, buttons, disclosure text, rep results |
| Subheading | 20px | Section headings, completion count |
| Heading | 32px | COACH, lift name, set/rep totals, season weights |
| Display | 48px | Recommended working weight |

DM Sans handles body text, labels, and section headings. Bebas Neue handles the main headings and large weight/target numbers. Mobile layouts retain the same text sizes; milestones and season facts stack to accommodate readable labels.

SVG trend labels use 16 viewBox units on desktop and 32 on mobile, following progression's approach. Their rendered size depends on chart width, rather than matching HTML text sizes directly.

Overrides are scoped to the modal. The shared coach stylesheet and progression page retain their existing styles.
