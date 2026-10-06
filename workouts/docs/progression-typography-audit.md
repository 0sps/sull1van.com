# Progression typography audit

Audited October 6, 2026, after replacing the lift dropdown.

The page uses too many sizes, and too much useful text sits at the smallest size. Consolidating ordinary text would improve readability more than further enlarging the display numbers.

## Inventory

This is a source audit of `progression.html`, `css/progression.css`, and the shared coaching stylesheet. It does not measure rendered text in a browser. Pixel equivalents assume the default 16px root size.

- The inline CSS and page stylesheet contain **31 distinct font-size definitions**, after treating equivalent rem and px values as the same size. This includes responsive expressions and overridden or unused rules.
- The final page stylesheet alone contains **22 distinct definitions**. These include four fluid sizes, the lift selector's calculated size, an icon size, and SVG chart label sizes.
- **30 of its 58 font-size declarations are 14px**. Another six are between 14px and 16px. These are declarations, rather than counts of visible elements.
- The SVG labels use 16, 32, and 40 CSS pixels within the chart's viewBox. Their displayed size depends on the chart's rendered width, so those numbers should not be treated as ordinary HTML text sizes.

## Small text

| Size | Examples in the current page | Assessment |
| --- | --- | --- |
| 14px | Navigation, chart metric buttons, chart legends, chart notes, status pills, table headings, lift status descriptions, activity labels, tracked-lift ring caption | Used too broadly. Main controls and useful explanations should be 16px; reserve 14px for brief secondary metadata. |
| 14.4px | Working-set target, coach context readout, other-lift names | Too close to 14px to create a meaningful hierarchy. Consolidate at 16px. |
| 15.2px | Coach recommendation reason | Another slight variation. Use 16px for this substantive explanation. |
| 16px | Default body text and custom menu options | Good base for this interface. |
| 16.4px | Selected lift in the dropdown trigger | Exactly 2px larger than the previous 14.4px selector, as requested. Bold weight emphasizes the selected lift. |
| 16.8px | Lift Progress Chart and Tracked Lifts section titles | Barely larger than body copy. Use a clearer section-heading size. |

Shared coaching CSS still declares sizes below 14px for other interfaces. On this page, relevant caption, action-description, and button sizes have page-specific overrides. Consolidation should use a page-owned scale rather than changing shared styles for unrelated pages.

## Guidance and recommendation

[Nielsen Norman Group](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) recommends three primary size levels for a clear hierarchy, using weight and grouping as additional distinctions. [GOV.UK's tested type scale](https://design-system.service.gov.uk/styles/type-scale/) uses a broader defined scale, with 16px for small text and 19px for normal body text, including on small screens. These approaches support using a deliberate, limited scale rather than numerous tiny increments.

For this dashboard, use **14px metadata, 16px body and controls, 20px subsection headings, and 32px section headings**, with **48px and 64px display sizes** for large lift weights and week numbers. Keep the requested selector enlargement as an explicit exception. Fluid display sizes and SVG scaling can remain separate from the ordinary text hierarchy.

Prioritize enlarging navigation and chart controls, then recommendation explanations and lift status descriptions. Keep small dates and short footnotes at 14px. Finally, replace scattered numeric values with typography variables and remove superseded declarations.

This audit recommends the next typography changes; it does not apply a new page-wide type scale.
