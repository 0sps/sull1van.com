---
layout: post
title: "[TOOL] A better way to track blood test results"
date: 2026-05-18
tags: [personal, tech]
published: true
accent_color: "#93c5fd"
---


<style>
  .liver-enzymes-tooltip {
    border-bottom: 3px solid #777;
    cursor: pointer;
    position: relative;
    display: inline;
    outline-offset: 0.2em;
  }
  html[data-theme="dark"] .liver-enzymes-tooltip {
    border-bottom-color: #aaa;
  }
  .liver-enzymes-tooltip:focus-visible {
    outline: 2px solid #777;
    border-radius: 0.15em;
  }
  html[data-theme="dark"] .liver-enzymes-tooltip:focus-visible {
    outline-color: #aaa;
  }
  /* Default: render on top of the text when screenspace is limited or JS is unavailable */
  .tooltip-card-container {
    position: absolute;
    bottom: 130%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100;
  }
  .liver-enzymes-tooltip:not(.is-hover-suppressed):hover .tooltip-card-container,
  .liver-enzymes-tooltip:focus-visible .tooltip-card-container,
  .liver-enzymes-tooltip.is-pinned .tooltip-card-container {
    opacity: 1;
    pointer-events: auto;
  }
  .tooltip-connector-line {
    display: none;
  }

  .tooltip-card-container.is-measured {
    bottom: auto;
    left: var(--tooltip-left);
    top: var(--tooltip-top);
  }
  .tooltip-card-container.is-margin {
    transform: translateY(-50%);
    flex-direction: row;
    align-items: center;
  }
  .tooltip-card-container.is-margin.is-left {
    flex-direction: row-reverse;
  }
  .liver-enzymes-tooltip:not(.is-hover-suppressed):hover .tooltip-card-container.is-margin,
  .liver-enzymes-tooltip:focus-visible .tooltip-card-container.is-margin,
  .liver-enzymes-tooltip.is-pinned .tooltip-card-container.is-margin {
    transform: translateY(-50%);
  }
  .tooltip-card-container.is-margin .tooltip-connector-line {
    display: block;
    width: var(--tooltip-connector-width, 40px);
    height: 3px;
    background: #777;
    flex-shrink: 0;
  }
  html[data-theme="dark"] .tooltip-card-container.is-margin .tooltip-connector-line {
    background: #aaa;
  }
  .tooltip-card-container.is-margin .tooltip-card {
    position: relative;
  }

  .tooltip-card {
    width: 153px;
    background: #eee;
    border: 1px solid #999;
    border-radius: 0;
    padding: 0.935rem 1.02rem;
    box-shadow: 0 0.15rem 0.35rem rgba(0, 0, 0, 0.12);
    font-family: inherit;
    color: inherit;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  html[data-theme="dark"] .tooltip-card {
    background: #1b1b1b;
    border-color: #555;
    box-shadow: 0 0.15rem 0.35rem rgba(0, 0, 0, 0.45);
  }
  .biomarker-item {
    text-align: center;
    display: block;
  }
  .biomarker-item:first-child {
    margin-bottom: 0.85rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid #bbb;
  }
  html[data-theme="dark"] .biomarker-item:first-child {
    border-bottom-color: #444;
  }
  .biomarker-value {
    font-size: 1.77rem;
    font-weight: 800;
    color: #555;
    line-height: 1;
    letter-spacing: 0;
    display: block;
  }
  html[data-theme="dark"] .biomarker-value {
    color: #ddd;
  }
  .biomarker-name {
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0;
    margin-top: 0.25rem;
    display: block;
  }
  .biomarker-range {
    font-size: 0.8625rem;
    margin-top: 0.1rem;
    opacity: 0.7;
    display: block;
  }
  .biomarker-source {
    align-self: flex-end;
    font-size: 0.68rem;
    font-style: italic;
    line-height: 1.2;
    margin-top: 0.8rem;
    opacity: 0.65;
    text-align: right;
  }
  .mobile-toc {
    display: none;
    margin: 2rem 0;
    padding: 1.2rem;
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.04);
  }
  .mobile-toc-title {
    font-weight: 700;
    margin-bottom: 0.8rem;
    font-size: 1.1em;
  }
  .mobile-toc ul {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }
  .mobile-toc li {
    margin: 0.5rem 0;
  }
  .mobile-toc li.nested {
    padding-left: 1.2rem;
  }
  .mobile-toc a {
    text-decoration: none;
    color: inherit;
  }
  .mobile-toc a:hover {
    text-decoration: underline;
  }
  @media (max-width: 767px) {
    .mobile-toc {
      display: block;
    }
  }
  html[data-theme="dark"] .mobile-toc {
    background: rgba(20, 20, 20, 0.45);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
  }
  .note-card {
    border: 1px solid #c9b99a;
    border-radius: 8px;
    margin: 2rem 0;
    overflow: hidden;
    background: #faf6f0;
  }
  .note-card summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.85rem;
    cursor: pointer;
    font-size: 0.78em;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    list-style: none;
    user-select: none;
    color: #8c7355;
  }
  .note-card summary::-webkit-details-marker { display: none; }
  .note-card summary::before {
    content: '▸';
    font-size: 0.9em;
    transition: transform 0.2s ease;
    display: inline-block;
  }
  .note-card[open] summary::before { transform: rotate(90deg); }
  .note-card-body {
    padding: 0.6rem 1rem 0.75rem;
    border-top: 1px solid #c9b99a;
    font-size: 0.9em;
    color: #5c4a32;
  }
  .note-card-body p {
    margin: 0.5rem 0;
    line-height: 1.5;
  }
  html[data-theme="dark"] .note-card { border-color: #4a3e2e; background: #1e1a14; }
  html[data-theme="dark"] .note-card summary { color: #a08860; }
  html[data-theme="dark"] .note-card-body { border-top-color: #4a3e2e; color: #c0a878; }
</style>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('.liver-enzymes-tooltip'));
    var marginGap = 18;
    var viewportPadding = 16;

    function positionTooltip(trigger) {
      var cardContainer = trigger.querySelector('.tooltip-card-container');
      var card = trigger.querySelector('.tooltip-card');
      var connector = trigger.querySelector('.tooltip-connector-line');
      var main = trigger.closest('main') || document.querySelector('main');

      if (!cardContainer || !card || !main) return;

      cardContainer.classList.remove('is-measured', 'is-margin', 'is-left');
      cardContainer.style.removeProperty('--tooltip-left');
      cardContainer.style.removeProperty('--tooltip-top');
      cardContainer.style.removeProperty('--tooltip-connector-width');

      var mainRect = main.getBoundingClientRect();
      var triggerRect = trigger.getBoundingClientRect();
      var cardRect = card.getBoundingClientRect();
      var connectorWidth = connector ? connector.getBoundingClientRect().width : 40;
      var neededWidth = cardRect.width + connectorWidth + marginGap;
      var rightSpace = window.innerWidth - mainRect.right - marginGap - viewportPadding;
      var leftSpace = mainRect.left - marginGap - viewportPadding;
      var cardTop = triggerRect.height / 2;

      if (rightSpace >= neededWidth) {
        var connectorWidthPx = Math.min(56, Math.max(24, rightSpace - cardRect.width));
        cardContainer.classList.add('is-measured', 'is-margin');
        cardContainer.style.setProperty('--tooltip-left', (mainRect.right + marginGap - triggerRect.left) + 'px');
        cardContainer.style.setProperty('--tooltip-top', cardTop + 'px');
        cardContainer.style.setProperty('--tooltip-connector-width', connectorWidthPx + 'px');
        return;
      }

      if (leftSpace >= neededWidth) {
        var leftConnector = Math.min(56, Math.max(24, leftSpace - cardRect.width));
        cardContainer.classList.add('is-measured', 'is-margin', 'is-left');
        cardContainer.style.setProperty('--tooltip-left', (mainRect.left - leftConnector - cardRect.width - triggerRect.left) + 'px');
        cardContainer.style.setProperty('--tooltip-top', cardTop + 'px');
        cardContainer.style.setProperty('--tooltip-connector-width', leftConnector + 'px');
      }
    }

    function refreshOpenTooltips() {
      triggers.forEach(function (trigger) {
        if ((trigger.matches(':hover') && !trigger.classList.contains('is-hover-suppressed')) || trigger.matches(':focus-visible') || trigger.classList.contains('is-pinned')) {
          positionTooltip(trigger);
        }
      });
    }

    triggers.forEach(function (trigger) {
      var cardContainer = trigger.querySelector('.tooltip-card-container');

      if (cardContainer) {
        cardContainer.addEventListener('click', function (event) {
          event.stopPropagation();
        });
      }

      trigger.addEventListener('mouseenter', function () {
        positionTooltip(trigger);
      });
      trigger.addEventListener('mouseleave', function () {
        trigger.classList.remove('is-hover-suppressed');
      });
      trigger.addEventListener('focus', function () {
        positionTooltip(trigger);
      });
      trigger.addEventListener('click', function (event) {
        event.stopPropagation();
        var wasPinned = trigger.classList.contains('is-pinned');

        if (wasPinned) {
          trigger.classList.remove('is-pinned');
          trigger.classList.add('is-hover-suppressed');
          trigger.setAttribute('aria-expanded', 'false');
          return;
        }

        trigger.classList.remove('is-hover-suppressed');
        trigger.classList.add('is-pinned');
        trigger.setAttribute('aria-expanded', 'true');
        positionTooltip(trigger);
      });
      trigger.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          trigger.click();
        }
        if (event.key === 'Escape') {
          trigger.classList.remove('is-pinned');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    });

    document.addEventListener('click', function () {
      triggers.forEach(function (trigger) {
        trigger.classList.remove('is-pinned');
        trigger.setAttribute('aria-expanded', 'false');
      });
    });
    window.addEventListener('resize', refreshOpenTooltips);
  });
</script>

Over one year ago, I made the decision to start focusing on my bloodwork. I had just gotten the first comprehensive metabolic panel in years, and the results weren't great. <span class="liver-enzymes-tooltip" role="button" tabindex="0" aria-expanded="false">My liver enzymes ALT and AST<span class="tooltip-card-container"><span class="tooltip-connector-line"></span><span class="tooltip-card"><span class="biomarker-item"><span class="biomarker-value">147</span><span class="biomarker-name">AST</span><span class="biomarker-range">Normal: 10–40 U/L</span></span><span class="biomarker-item"><span class="biomarker-value">71</span><span class="biomarker-name">ALT</span><span class="biomarker-range">Normal: 9–46 U/L</span></span><span class="biomarker-source">Source: LabCorp, March 2025</span></span></span></span> were extremely high, in such an embarrassing way that it basically screamed *this person drinks too much alcohol* [1]. I realized that a bigger effort was needed if I was going to take charge of my health.


I started by looking at the data. Luckily for me, I've always had some sort of a focus on health, and I already had some two-dozen PDFs of blood test results dating back to 2018 in a folder on my computer. Every time I would get one, I'd save the results from the doctor as a PDF and drop it into that folder. While it was great to have, it was a mess to actually go through. I really wanted to make some comprehensive Excel spreadsheet with all of it, but assumed it would be too much work for one person to do.

<div style="text-align: center; margin: 2rem auto;">
    <img src="/assets/images/2026-05-18-tracking-blood-tests/bloodTest.png" alt="List of PDFs" style="max-width: 100%; height: auto;" />
</div>



<div class="mobile-toc">
  <div class="mobile-toc-title">Table of Contents</div>
  <ul>
    <li><a href="#my-plan">My Plan</a></li>
    <li><a href="#how-it-went">How it went</a></li>
    <li class="nested"><a href="#steps-1-4-data-conversion">Steps 1-4: Data conversion</a></li>
    <li class="nested"><a href="#step-5-the-dashboard">Step 5: The Dashboard</a></li>
    <li class="nested"><a href="#the-frontend">The Frontend</a></li>
    <li class="nested"><a href="#the-backend">The Backend</a></li>
    <li><a href="#closing-thoughts">Closing thoughts</a></li>
    <li class="nested"><a href="#references">References</a></li>
  </ul>
</div>

## My Plan

My plan was pretty simple, just:
1. Command Claude or Codex to delegate an army of subagents to process all my PDFs
2. File by file, comprehensively pull all numeric and non-numeric test results out
3. Create a master datasheet with all these results
4. Run a separate set of agents to check the first agents' work, and report any inaccuracies they find.
5. Create a central dashboard to read and manage all my blood test results

It's a lot. But since AI resources are virtually infinite, I was confident that it could be built.

## How it went

### Steps 1-4: Data conversion
This was honestly easier than I expected. Claude and Codex both did a great job dispatching agents and converting the blood test results into an Excel sheet. The cool part is the verification bots didn’t find any actual errors, they just flagged places where the wrong units were used, like an ALT test from 2018 in ng/dL while the 2020 ALT was in ug/L. I did a manual spot check across the whole dataset and it looked great.

<div style="text-align: center; margin: 2rem auto;">
    <img src="/assets/images/2026-05-18-tracking-blood-tests/bloodTestExcel.png" alt="List of PDFs" style="max-width: 100%; height: auto;" />
</div>


### Step 5: The Dashboard

With the data in *some* kind of usable format, this was the part where I had some fun. I started by asking Claude and Codex to both design a rudimentary visual for the labs. My idea was pretty simple. It would have a dual layout, card-based and list-based, where you pick between the two views and get either one card or one list item per blood test. They always show the most recent result and its unit, and they’re color coded green or red depending on whether the result falls outside the normal range.

<details class="note-card">
  <summary>Note</summary>
  <div class="note-card-body">
    <p>But what counts as a ‘normal range’? Depends who you ask! My results often showed different reference ranges for the same test across the years, which I mostly chalk up to the slight differences in how LabCorp and Quest Diagnostics calculate their normal ranges. Within a single company I didn’t see much variation.</p>
    <p>Either way, I built a system to handle it. Each blood test record, both in my backend database and in my spreadsheet, includes the reference range the lab gave me at the time of the test. The web UI parses this and shows the most recent range. These tests don't always come with a range, so the site keeps crawling older and older records until it finds one, and that’s the reference  you see on the display.</p>
  </div>
</details>


### The Frontend

Claude iterated on my design a few times, and the early prototypes were ugly. Inspired by the latest iOS update and wanting something a bit better than flat, I pushed the AI toward a glassmorphic UI. I’m really proud of how it turned out.

<style>
  .gallery-section {
    display: flex;
    flex-direction: column;
    gap: 3rem;
    margin: 2rem auto;
  }
  .gallery-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    align-items: center;
  }
  .gallery-images-double {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .gallery-caption {
    font-size: 0.9em;
    line-height: 1.5;
    color: #666;
  }
  html[data-theme="dark"] .gallery-caption {
    color: #aaa;
  }
  .gallery-img {
    width: min(100%, 253px);
    max-width: 100%;
    margin: 0 auto;
    display: block;
    border: 4px solid #bbb;
    border-radius: 27px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    box-sizing: border-box;
  }
  @media (min-width: 550px) {
    .gallery-row.layout-2-1 {
      grid-template-columns: 2.2fr 1fr;
    }
    .gallery-row.layout-1-1 {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>

<div class="gallery-section">
  <!-- Row 1: screen1 & screen2 + caption -->
  <div class="gallery-row layout-2-1">
    <div class="gallery-images-double">
      <img src="/assets/images/2026-05-18-tracking-blood-tests/screen1.jpg" alt="Prototype Card View" class="gallery-img" />
      <img src="/assets/images/2026-05-18-tracking-blood-tests/screen2.jpg" alt="Prototype List View" class="gallery-img" />
    </div>
    <div class="gallery-caption">
      Card versus list UI view
    </div>
  </div>

  <!-- Row 2: screen3 + caption -->
  <div class="gallery-row layout-1-1">
    <div>
      <img src="/assets/images/2026-05-18-tracking-blood-tests/screen3.jpg" alt="Midnight Mode" class="gallery-img" />
    </div>
    <div class="gallery-caption">
      The UI comes with many different modes, meant to highlight different points throughout the day. I wanted to simulate the UI of the Apple Weather app, because that is my ideal design for something that shows health data. It actually took a long time to achieve this UI, so I'm proud of the result.
    </div>
  </div>

  <!-- Row 3: screen4 & screen5 + caption -->
  <div class="gallery-row layout-2-1">
    <div class="gallery-images-double">
      <img src="/assets/images/2026-05-18-tracking-blood-tests/screen4.jpg" alt="Detail View" class="gallery-img" />
      <img src="/assets/images/2026-05-18-tracking-blood-tests/screen5.jpg" alt="History and Context Menus" class="gallery-img" />
    </div>
    <div class="gallery-caption">
      **Left**: detail view showing most recent test, normal range, and units. **Right**: view when you scroll down. Shows all test history, and offers context menus which present additional options
    </div>
  </div>

  <!-- Row 4: screen6 -->
  <div class="gallery-row">
    <div style="max-width: 100%; margin: 0 auto; width: 100%;">
      <img src="/assets/images/2026-05-18-tracking-blood-tests/screen6.jpg" alt="Prototype Screen 6" class="gallery-img" />
    </div>
        <div class="gallery-caption">
      The card view with daytime mode enabled. It was extremely hard to get the UI to this state, so honestly I'm blown away it all works.
    </div>
  </div>

  <!-- Row 5: screen7 + caption -->
  <div class="gallery-row layout-1-1">
    <div>
      <img src="/assets/images/2026-05-18-tracking-blood-tests/screen7.jpg" alt="Prototype Screen 7" class="gallery-img" />
    </div>
    <div class="gallery-caption">
      Screenshot of Cmd+K. I don't have a better name for it, but it's triggered by Cmd+K on desktop, so 
    </div>
  </div>
</div>

Once I finished, I spun up some more Claude subagents to do bug catching, and in the middle of that one of them suggested a new feature I really liked. That's what you're seeing in the last screenshot, actually. It's a power menu that's triggered by tapping the little flask on mobile or hitting Cmd+K on desktop. When you open it, you can instantly pull up test results, create an export PDF, or even add a new lab. It's really powerful and designed to be my place to drop in when I need to locate a result as fast as possible.

---

That's pretty much the entirety of the UI. I really loved designing it, especially the glass background. I was going for an imitation of Apple Weather, and I think we (me/Claude) nailed it.


### The Backend

For backend storage I went with Google Firebase. The only real alternative people seem to be using nowadays is Supabase, and that has an awful free tier. Google’s looked better for the long haul. But since Google prices based on # reads, the data model I ended up with is honestly pretty funny.

Firebase gives you 50K reads/writes a day for free. After that it’s some absurdly low rate, like $0.03 / 100K reads (i think). The other great thing is the 1MB data record limit. 1 megabyte! 😂 That’s about 1 million characters. For reference, the Great Gatsby comes in around 240,000. My blood test results are never going to be as long as the Great Gatsby, so therefore I decided to store **my entire database in one Firebase entry**.

It's safe to say that this setup will never cost me a dime. The only remaining question is what the data will look like when we send it to Firebase. I iterated with Claude, and we settled on the following schema for a master format:
```json
  {
    "schemaVersion": 1,
    "tests": [
      {
        "name": "string",
        "unit": "",
        "range": "",
        "type": "",
        "points": [
          {
            "date": "YYYY-MM-DD",
            "rawResult": "",
            "lab": "",
            "sourceFile": "",
            "testResultId": "",
            "rawRange": "",
            "unit": "",
            "sourcePage": "",
            "reviewStatus": "",
            "verificationStatus": ""
          }
        ]
      }
    ]
  }
```


This schema looked pretty good. I sent it to firebase, but then realized I just stored private health data in plaintext, which is stupid. It definitely needed to be obfuscated. I thought about just encrypting the values themselves, and leaving the json keys themselves plaintext. But that is also pointless since the metadata (test name, test date) matters just as much. So I settled on a Base64 AES-GCM ciphertext of JSON.stringify(vaultData), which turns the whole thing into a string and encrypts all of it.

---

With that, it finally looked good. I wired up the Firebase integration and ran a one-time script to push all my data, and it worked on the first try. I've been using this site ever since then to track my test results. 

The firestore database has essentially become my new source of truth. I still make regular exports so there's the Firestore database and a Excel sheet running in parallel, giving me dual sources of truth. It's a little extra effort, but I want to be protected in case something gets mangled in the database and my data becomes unusable. 


## Closing thoughts

This project was genuinely a lot of fun. I reach for the web app whenever I need to look up a blood test value, and whenever I bump into a new bug or feature idea I can just build it. Over time I’ve added a ton of functionality, and it’s become a really solid home for my data. It's also easy to share it, making conversations with doctors and family much easier. I might publish this web app to Github if there is interest, but for right now it's just a happy webapp that sits on my phone.

*It also helps feed my obsession of actually trying to optimize these numbers. Since creating this dashboard, I actually did a whole project where I used it to help dial in my supplement routine and help out my liver. If you're interested, feel free to take a look at that [here](https://sull1van.com/best-liver-of-all-time).*


### References
[1] Per NIH, [https://pmc.ncbi.nlm.nih.gov/articles/PMC4155359/](https://pmc.ncbi.nlm.nih.gov/articles/PMC4155359/): 
  "In most types of liver damage, ALT is higher than AST. However, in alcohol-related liver injury, the enzyme AST is typically two to three times higher than ALT. An AST-to-ALT ratio greater than 2:1 strongly suggests alcohol is the cause."


<style>
  .img-lightbox-trigger { cursor: zoom-in; }
  #img-lightbox {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 10000;
    align-items: center;
    justify-content: center;
    padding: 40px;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
    transition: background 0.35s ease, backdrop-filter 0.35s ease;
    cursor: zoom-out;
  }
  #img-lightbox.is-open {
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(6px);
  }
  #img-lightbox img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    transform: scale(0.85);
    opacity: 0;
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
  }
  #img-lightbox.is-open img {
    transform: scale(1);
    opacity: 1;
  }
  .img-lightbox-close {
    position: absolute;
    top: 18px;
    right: 24px;
    font-size: 2em;
    line-height: 1;
    color: rgba(255, 255, 255, 0.8);
    background: none;
    border: none;
    cursor: pointer;
    font-family: sans-serif;
    user-select: none;
  }
  .img-lightbox-hint {
    position: absolute;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.55);
    font-family: sans-serif;
    font-size: 0.82em;
    letter-spacing: 1.5px;
    user-select: none;
    pointer-events: none;
  }
</style>

<div id="img-lightbox">
  <button class="img-lightbox-close" aria-label="Close">&#x2715;</button>
  <img src="" alt="">
  <span class="img-lightbox-hint">click anywhere to dismiss</span>
</div>

<script>
  (function () {
    var lightbox = document.getElementById('img-lightbox');
    if (!lightbox) return;
    var lightboxImg = lightbox.querySelector('img');
    var main = document.querySelector('main') || document.body;

    function openLightbox(src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          lightbox.classList.add('is-open');
        });
      });
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      setTimeout(function () {
        lightbox.style.display = 'none';
        lightboxImg.src = '';
        document.body.style.overflow = '';
      }, 350);
    }

    Array.prototype.forEach.call(main.querySelectorAll('img'), function (img) {
      if (img.closest('#img-lightbox')) return;
      img.classList.add('img-lightbox-trigger');
      img.addEventListener('click', function (e) {
        var anchor = img.closest('a');
        if (anchor) e.preventDefault();
        e.stopPropagation();
        openLightbox(img.currentSrc || img.src, img.alt);
      });
    });

    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
    });

    document.querySelectorAll('.note-card summary').forEach(function (summary) {
      summary.addEventListener('click', function (e) {
        e.preventDefault();
        var details = summary.closest('details');
        var y = window.scrollY;
        details.open = !details.open;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { window.scrollTo(0, y); });
        });
      });
    });
  })();
</script>
