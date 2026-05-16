---
layout: post
title: "7,500 Miles in a Self-Driving Car (Kind Of)"
date: 2026-05-15
tags: [personal, tech]
---
<div id="splash-background"></div>
<div id="splash-gradient"></div>
<div id="content-bg-cover"></div>

<style>
  /* Override body backgrounds to let the splash show through */
  html body, html[data-theme="dark"] body, html[data-theme="light"] body {
    background: transparent !important;
  }

  #splash-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-image: url('/assets/images/splash.jpeg');
    background-size: cover;
    background-position: center top;
    z-index: -3;
  }

  #splash-gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 100%);
    z-index: -2;
    pointer-events: none;
  }

  #content-bg-cover {
    position: absolute;
    top: 100vh;
    left: 0;
    width: 100%;
    height: calc(100% + 100000px); /* Tall enough to cover all scrolling content */
    background: #fff;
    z-index: -2;
  }

  /* Dark mode backgrounds */
  @media (prefers-color-scheme: dark) {
    #splash-gradient { background: linear-gradient(to bottom, rgba(17,17,17,0) 0%, #111 100%); }
    #content-bg-cover { background: #111; }
  }
  html[data-theme="dark"] #splash-gradient { background: linear-gradient(to bottom, rgba(17,17,17,0) 0%, #111 100%); }
  html[data-theme="dark"] #content-bg-cover { background: #111; }
  html[data-theme="light"] #splash-gradient { background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 100%); }
  html[data-theme="light"] #content-bg-cover { background: #fff; }

  /* Title styling */
  h1 {
    display: inline-block;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    margin-top: 66vh;
  }

  @media (prefers-color-scheme: dark) {
    h1 { background: rgba(0, 0, 0, 0.3); }
  }
  html[data-theme="dark"] h1 { background: rgba(0, 0, 0, 0.3); }
  html[data-theme="light"] h1 { background: rgba(255, 255, 255, 0.3); }
</style>

### The idea

In summer 2025, I drove about 7,500 miles across the United States. Before I left, I installed a Comma 3X in my car, spent weeks getting it configured, and slowly built enough trust in it to let it handle most of the highway driving.

This is not really a travel post. It is mostly about what it feels like to take a consumer self-driving-ish setup from “box on my desk” to “driving across the country.”

### Why I bought one

Talk about what made you interested:
- long road trip coming up
- curiosity about openpilot
- wanting to see how good it actually was
- maybe the difference between “self-driving” marketing and what it really does

### What Comma actually is

Plain-English explainer:
- Comma 3X
- openpilot
- it does lane centering and adaptive cruise
- it is not autonomous
- you are still responsible the whole time

This section should be short and non-technical enough that a normal person can follow it.

### Installing it

This is where the article starts getting fun.

Cover:
- unboxing
- mounting it
- routing the cable
- connecting to the car harness
- first boot
- anything that felt sketchy, surprisingly easy, or annoying

Tone idea: “It is weird to install a device in your car and then expect it to steer.”

### Getting it to work

This should be one of the main sections.

Cover:
- the software setup
- forks, settings, toggles, car compatibility, calibration
- any coding/configuration you had to do
- what was confusing
- what finally made it click

This is probably where your technical personality can come through without turning it into a manual.

### Testing it around town

This sounds like the heart of the piece.

Cover:
- first drives in your city
- places where it worked
- places where it absolutely did not
- weird behavior at intersections, curves, lane markings, construction, parked cars, etc.
- the emotional progression from “absolutely not” to “okay, I see it”

### Learning when not to trust it

A dedicated section for the weird stuff.

Examples:
- overconfidence in certain lane markings
- hesitation
- weird disengagements
- driver monitoring nags
- sun glare, rain, construction, bad roads
- things humans find obvious that the car does not

This can be funny and specific. The less polished, the better.

### The first time it felt normal

There should be a turning-point section. Not “I trusted it fully,” because that sounds irresponsible. More like:
- when you stopped hovering over every tiny input
- when you realized it was reducing fatigue
- when it became a driving partner rather than a gadget

### Taking it west

Now the road trip enters. Keep this brief:
- 7,500 miles
- highways, deserts, mountains, long empty roads
- how often it drove
- what it was good at
- what still required you
- fatigue difference

This section should feel like payoff, not the whole article.

### What it changed about driving

End with reflection:
- not “self-driving is here”
- more like “this changed what long-distance driving felt like”
- it made driving less tiring, but not effortless
- it made you more aware of what driving actually involves
- it made the future feel both closer and messier

### The honest conclusion

The Comma did not drive me across the country. I drove across the country with a very good, very strange assistant that could handle the boring parts better than I expected and the weird parts about as well as you would hope from a camera taped to a windshield.

That sounds like a joke, but 7,500 miles later, I missed it when it was off.
