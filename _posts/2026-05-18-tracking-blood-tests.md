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
The process was honestly easier than I expected. Claude and Codex both did a great job dispatching agents and converting the blood test results to an excel sheet. What's also really cool is the verification bots didn't find any errors, they just found instances in which the wrong units were used. For example, an ALT test from 2018 used ng/dL, while the ALT from 2020 used ug/L. I did a manual spot check throughout the entire dataset and it looked great.


<div style="text-align: center; margin: 2rem auto;">
    <img src="/assets/images/2026-05-18-tracking-blood-tests/bloodTestExcel.png" alt="List of PDFs" style="max-width: 100%; height: auto;" />
</div>


### Step 5: The Dashboard

With the data in *some* kind of usable format, this was the part where I had some fun. I started by asking Claude and Codex to both design some rudimentary visual for the labs. My thought process was pretty straightforward: let's make a dual layout, card-based and list-based. User selects between these two views, and it's either one card or one list item per blood test. They will always show the *most recent* result, followed by the relevant unit. They will be color coded green or red, based on whether they fall outside the normal range for that test.

But what constitutes a 'normal range'? **Depends who you ask!**
  My blood test results frequently showed different reference ranges for the same blood test across the years. I attribute this mainly to the slight differences between how the two behemoths in the space, LabCorp and Quest Diagnostics, calculate their normal range. I did not find significant variability from within the same company, however. 

  Either way, I ended up making a system for that: each blood test record in my backend database, and in my spreadsheet, *includes* the reference range that the lab gave me for that test at the time of taking. Then, the web UI parses it and shows the *most recent* normal range given. Sometimes they don't give a normal range for a test, so the website will keep crawling older and older records, until it finds a record with a reference range. That will be the reference range you see on the display.


### The Frontend

Claude iterated on my design requests a few times, and the early prototypes were ugly. Being inspired by the latest slop iOS update, and wanting something a little better than flat, I pushed the AI to develop a glassmorphic UI. The result is something I'm really proud of:

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

After I finished, I pulled up some more claude subagents and dispatched them to do bug catching. While in the middle of that, one of them offered up a new feature suggestion that I really liked. That's what you're seeing in the last screenshot: it's a power menu, triggered by tapping the little flask on mobile or hitting Cmd+K on desktop.

When you open it, you can instantly pull up test results, create an export PDF, or even add a new lab. It's really powerful and designed to be my place to drop in when I need to locate a result as fast as possible.

---

That's pretty much the entirety of the UI. I really loved designing it, especially the glass background. I was going for an imitation of Apple Weather, and think that we (me/Claude) knocked it out of the park.


### The Backend

For backend data storage, I decided to use Google Firebase. Why? Well, the only real alternative people seem to be using nowadays is Supabase, and that has an awful free tier. Google's seemed to be better for long-term use, so I went with them. The data model I made was quite funny, honestly.

Google Firebase offers you 50K Reads/writes a day, totally free. After that it's some insanely low rate, like $0.03 / 100K reads (don't quote me on that). The other great thing about Firebase is that it has a data record limit of 1MB.

**1 Megabyte! 😂**

So 1 megabyte is about 1 million characters. For reference, the Great Gatsby is estimated to be about 240,000.

That's a lot of characters! My blood test results will never be as long as the Great Gatsby. And so for that reason, **we are storing the entire set of blood test results in one Firestore entry!** 


So it's safe to say that this setup will never cost me a dime. The only remaining question is what the data will look like when we send it to Firebase. I iterated with Claude, and we settled on the following schema for the master dataset:
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


This schema looked pretty good. I sent it to firebase, but then realized this was private health data getting stored in plaintext. There should ideally be some encryption protecting it. 

I thought about different ways to encrypt it. We could encrypt the values themselves, but thought that was stupid. The metadata (test name, test date) is equally as important. For that reason, I settled on this: make it a *Base64 AES-GCM ciphertext of JSON.stringify(vaultData).* Turn the entire thing into a string and then encrypt it all. 

---

And with that, it finally looked good. I wired up the Firebase integration, and ran a one-time script to push all my data. It worked on the first try. And since then, I've been using this site to track my test results. 

The firestore database has essentially become my new source of truth. I do make regular exports so that we have the Firestore database and Excel sheet running in parallel, giving me dual sources of truth. It's a little extra effort, but I want to be protected in case something gets mangled in the database and my data becomes unusable. 


## Closing thoughts

This project was genuinely a lot of fun. I've been using the web app regularly whenever I need to source blood test values. It's also cool because as I stumble upon new issues or feature ideas in the UI, I can implement them easily. I've added a ton of cool functionality to the site over time, and it's become a very robust landing place for my data. It also makes it very easy to share the results with others.

It also helps fuel my obsession for optimizing these blood test results, and my biomarkers have continued to get better and better ever since I built this dashboard. I've changed my diet and experimented with a bunch of supplements over the last year, looking to figure out what moves the needle. That could honestly be another blog post itself. (Update: it IS another post now! [see here](https://sull1van.com/best-liver-of-all-time)) But for now, I'll stick to sharing the way I track all this stuff. If there's enough interest then I may definitely start to explain how I used it to actually track and drive improvement.



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
  })();
</script>
