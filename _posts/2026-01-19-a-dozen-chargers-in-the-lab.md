---
layout: post
title: "A Dozen Chargers in the Lab"
date: 2026-01-18
tags: [technology]
devices:
  - name: "Macbook Pro M1"
    img1: "/assets/images/macbook pro 1.png"
    img2: "/assets/images/macbook pro 2.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      The macbook pro has the cleanest power signature of the devices I tested. This was to be expected, since a MacBook Pro is just pulling DC current from its internal battery and sending it out. No AC->DC conversion required. 
      
      There's also no high frequency switching noice, or any noticeable ripple. This makes sense, since it doesn't have to swtich thousands of times a second to step down AC voltage into something manageable.
    rating: 5
    noise_rating: 5
    ripple_rating: "N/A"
    overall_rating: 5
    
  - name: "Anker 621 MAG GO 5000mAh Battery"
    img1: "/assets/images/Anker a1654 Maggo power bank.png"
    img2: "/assets/images/Anker a1654 Maggo power bank 2.png"
    bg: "hsl(120, 32%, 93%)"
    caption: "Again, another battery, so good power quality is to be expected. Nothing major here. No noise, clean power signature. This is a good one to have."
    rating: 5
    noise_rating: 5
    ripple_rating: 4
    overall_rating: 5
  - name: "Spigen PowerArc ArcStation Pro"
    img1: "/assets/images/Spigen PowerArc 1.png"
    img2: "/assets/images/Spigen PowerArc 2.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      I was originally skeptical of this one, due to some prior tests that showed higher noise. This was marketed as one of the first GaN chargers, being released sometime back around 2023. Luckily my original test was flawed and subsequent runs proved that this is a very high quality charger. One of the best I've tested. It's using a ~140KHz switching frequency, which is high enough that you can't see any ripple on the 50us graph. I zoomed out and there was a tiny amount of ripple, but not enough to be noticeable. the zoomed-out graph looks pretty similar to the one in this image, so i'm just showing you the zoomed in one here. Good charger. 
    rating: 5
    noise_rating: 5
    ripple_rating: 5
    overall_rating: 5
  - name: "Eero 15W Charger"
    img1: "/assets/images/eero.png"
    img2: "/assets/images/eero2.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      This one made me mad. For such a random charger, one that you can't even purchase yourself, it is remarkably high quality. Some ripple exists in the switching frequency, as you can see on the bottom graph, but it does a great job at filtering out the AC noise (which would show up as a higher 'floor' on the purple graph). It's got a sawtooth waveform, so there is noise, but it is pretty small. 
      
      Incredible charger, especially for its size.
    rating: 5
    noise_rating: 5
    ripple_rating: 3
    overall_rating: 5
  - name: "AOHI GaN Charger"
    img1: "/assets/images/AOHI GaN.png"
    img2: "/assets/images/AOHI GaN2.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      This one performed very well. It is marketed as a GaN charger, and uses some components that are so new they have never been used in consumer chargers before. So this charger really should be considered a flagship. for that reason, I'm a little disappointed the power signature isn't better. It IS very good, but for how bleeding-edge this charger is marketed out to me, it performs comparatively to chargers half its size and price.

      One future test I might do is examine the charger at higher power output. I didn't push it to the 100W limit in testing, but that is becuase I was using small wires that could have overheated. the charger might perform better at higher power output.
    rating: 5
    noise_rating: 5
    ripple_rating: 5
    overall_rating: 5
  - name: "Anker 637 Magnetic Charging Station"
    img1: "/assets/images/Anker 637 magnetic charging station USB A.png"
    img2: "/assets/images/Anker 637 magnetic charging station USB C.png"
    bg: "hsl(120, 32%, 93%)"
    caption: ""
    rating: 5
    noise_rating: 5
    ripple_rating: 5
    overall_rating: 5
  - name: "Counterfeit Chinese Wall Charger (USB A Only)"
    img1: "/assets/images/Counterfeit chinese outlet 1.png"
    img2: "/assets/images/Counterfeit chinese outlet 2.png"
    bg: "hsl(90, 32%, 93%)"
    caption: ""
    rating: 4
    noise_rating: 4
    ripple_rating: 3
    overall_rating: 4
  - name: "Apple 96W Macbook Charger"
    img1: "/assets/images/apple96W.png"
    img2: "/assets/images/apple96W2.png"
    bg: "hsl(90, 32%, 93%)"
    caption: ""
    rating: 4
    noise_rating: 4
    ripple_rating: 4
    overall_rating: 4
  - name: "Apple 30W Retail Charger"
    img1: "/assets/images/apple retail.png"
    img2: "/assets/images/apple retail 2.png"
    bg: "hsl(90, 32%, 93%)"
    caption: "Advertised at 30W, actual measured power was 29.5W. Solid performance."
    rating: 4
    noise_rating: 3
    ripple_rating: 3
    overall_rating: 4
  - name: "Anker ASPD053a"
    img1: "/assets/images/Anker ASP053a.png"
    img2: "/assets/images/Anker ASP053a 2.png"
    bg: "hsl(60, 32%, 93%)"
    caption: ""
    rating: 3
    noise_rating: 3
    ripple_rating: 3
    overall_rating: 3
  - name: "iPhone 17 pro"
    img1: "/assets/images/iphone 17 pro.png"
    bg: "hsl(60, 32%, 93%)"
    caption: "Over-performed! Advertised at 4.5W but pulled 5.4W during testing."
    rating: 3
    noise_rating: 3
    ripple_rating: "N/A"
    overall_rating: 3
  - name: "Shargeek Macintosh Charger"
    img1: "/assets/images/Shargeek Fun Macintosh Charger.png"
    img2: "/assets/images/Shargeek Fun Macintosh Charger2.png"
    bg: "hsl(60, 32%, 93%)"
    caption: "Hit its 27W target exactly. Perfect performance."
    rating: 3
    noise_rating: 3
    ripple_rating: 3
    overall_rating: 3
  - name: "Govee Power Supply"
    img1: "/assets/images/Govee 1.png"
    img2: "/assets/images/Govee 2.png"
    bg: "hsl(30, 32%, 93%)"
    caption: ""
    rating: 2
    noise_rating: 2
    ripple_rating: 3
    overall_rating: 2
  - name: "Dealworthy Charger"
    img1: "/assets/images/Dealworthy 1.png"
    img2: "/assets/images/Dealworthy  2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: ""
    rating: 1
    noise_rating: 2
    ripple_rating: 2
    overall_rating: 1
  - name: "Counterfeit AT&T"
    img1: "/assets/images/Counterfeit ATnT 1.png"
    img2: "/assets/images/Counterfeit ATnT 2.png"
    bg: "hsl(30, 32%, 93%)"
    caption: ""
    rating: 2
    noise_rating: 3
    ripple_rating: 3
    overall_rating: 2
  - name: "Amazon Kindle Charger"
    img1: "/assets/images/Amazon 1.png"
    img2: "/assets/images/Amazon kindle 2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: ""
    rating: 1
    noise_rating: 2
    ripple_rating: 1
    overall_rating: 1
  - name: "Apple HomePod Mini Charger"
    img1: "/assets/images/Apple Homepod Mini.png"
    img2: "/assets/images/Apple Homepod Mini 2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: ""
    rating: 1
    noise_rating: 1
    ripple_rating: 2
    overall_rating: 1
  - name: "Vebner GaN 65W Charger"
    img1: "/assets/images/VEBNERgan.png"
    img2: "/assets/images/VEBNERgaqn2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: ""
    rating: 1
    noise_rating: 1
    ripple_rating: 1
    overall_rating: 1
  - name: "Counterfeit Samsung"
    img1: "/assets/images/Counerfeit Samsung 1.png"
    img2: "/assets/images/Counerfeit Samsung 2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: ""
    rating: 1
    noise_rating: 1
    ripple_rating: 1
    overall_rating: 1
---

## A Dozen Chargers in the Lab: Apple is Okay, but Not the Best

<!-- INTRO: Write your opening paragraph(s) here. Why did you test this? What inspired you? (e.g. Ken Shirriff) What is the reader going to learn? -->

*Your intro goes here.*

---

## What I Tested

<!-- Briefly describe the collection of chargers — where they came from (official, counterfeit, old, new, etc.) -->

*Your overview of the charger collection goes here.*

---

## How I Tested Them

<!-- Describe your methodology: the oscilloscope, what Vpp means, what noise/ripple means and why it matters, etc. A paragraph or two here will make the rest of the article make sense. -->

*Your methodology section goes here.*

---

## The Results

<!-- Introduce the interactive card viewer below. Something like "Scroll through the results below — click any card to expand the oscilloscope traces." -->

*Your results intro goes here.*

<style>
  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-bottom: 32px;
  }
  .stats-table {
    border-collapse: collapse;
    width: 100%;
    min-width: 600px; /* Force scroll on mobile */
    font-family: sans-serif;
    font-size: calc(1em - 1px);
  }
  .stats-table th, .stats-table td {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 6px 10px;
  }
  .stats-table th {
    background-color: #f2f2f2;
  }
  .stats-table td.diff-pos { color: #228B22; font-weight: 700; }
  .stats-table td.diff-neg { color: #C41C00; font-weight: 700; }
  .stats-table td.diff-zero { color: #555; font-weight: 700; }
  .usba-badge {
    display: inline-block;
    margin-left: 7px;
    font-size: 0.8em;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #555;
    border: 1.5px solid #aaa;
    border-radius: 4px;
    padding: 1px 5px;
    vertical-align: middle;
    white-space: nowrap;
  }
  @media (prefers-color-scheme: dark) {
    .stats-table th, .stats-table td {
      border-color: #2a2a2a;
    }
    .stats-table th {
      background-color: #181818;
    }
    .usba-badge {
      color: #888;
      border-color: #444;
    }
  }
</style>

<div class="table-wrapper">
<table class="stats-table">
  <thead>
    <tr>
      <th>Charger</th>
      <th>Advertised (W)</th>
      <th>Voltage (V)</th>
      <th>Current (A)</th>
      <th>Actual (W)</th>
      <th>Difference (W)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><strong>Eero 15W Charger</strong></td><td>15</td><td>4.7</td><td>3.0</td><td>14.4</td><td class="diff-neg">-0.60</td></tr>
    <tr><td><strong>Shargeek Macintosh Charger</strong></td><td>27</td><td>8.9</td><td>3.0</td><td>27.0</td><td class="diff-zero">0.00</td></tr>
    <tr><td><strong>Apple 30W Retail Charger</strong></td><td>30</td><td>14.45</td><td>2.0</td><td>29.5</td><td class="diff-neg">-0.50</td></tr>
    <tr><td><strong>Apple HomePod Mini Charger</strong></td><td>20</td><td>8.6</td><td>2.0</td><td>17.5</td><td class="diff-neg">-2.50</td></tr>
    <tr><td><strong>Vebner GaN 65W Charger</strong></td><td>45</td><td>14.6</td><td>3.0</td><td>44.7</td><td class="diff-neg">-0.30</td></tr>
    <tr><td><strong>Govee Power Supply</strong><span class="usba-badge">USB A Only</span></td><td>10</td><td>4.5</td><td>2.0</td><td>9.3</td><td class="diff-neg">-0.70</td></tr>
    <tr><td><strong>Counterfeit AT&amp;T</strong><span class="usba-badge">USB A Only</span></td><td>10</td><td>4.7</td><td>2.0</td><td>9.6</td><td class="diff-neg">-0.40</td></tr>
    <tr><td><strong>Counterfeit Samsung</strong></td><td>10</td><td>4.4</td><td>2.0</td><td>8.9</td><td class="diff-neg">-1.10</td></tr>
    <tr><td><strong>Amazon Kindle Charger</strong></td><td>9.36</td><td>4.9</td><td>1.8</td><td>8.9</td><td class="diff-neg">-0.46</td></tr>
    <tr><td><strong>Counterfeit Chinese Wall Charger</strong><span class="usba-badge">USB A Only</span></td><td>10.5</td><td>4.5</td><td>2.13</td><td>9.6</td><td class="diff-neg">-0.90</td></tr>
    <tr><td><strong>Dealworthy Charger</strong></td><td>15</td><td>4.6</td><td>3.14</td><td>14.5</td><td class="diff-neg">-0.50</td></tr>
    <tr><td><strong>Anker 621 MAG GO 5000mAh Battery</strong></td><td>12</td><td>4.74</td><td>2.43</td><td>11.54</td><td class="diff-neg">-0.46</td></tr>
    <tr><td><strong>iPhone 17 pro</strong></td><td>4.5</td><td>4.81</td><td>1.12</td><td>5.39</td><td class="diff-pos">+0.89</td></tr>
    <tr><td><strong>Macbook Pro M1</strong></td><td>15</td><td>4.6</td><td>3.04</td><td>14.0</td><td class="diff-neg">-1.00</td></tr>
    <tr><td><strong>Anker ASPD053a</strong></td><td>40</td><td>14.55</td><td>2.7</td><td>39.4</td><td class="diff-neg">-0.60</td></tr>
    <tr><td><strong>Apple 96W Macbook Charger</strong></td><td>15</td><td>4.68</td><td>3.03</td><td>14.21</td><td class="diff-neg">-0.79</td></tr>
    <tr><td><strong>AOHI GaN Charger</strong></td><td>15</td><td>4.93</td><td>3.03</td><td>14.99</td><td class="diff-neg">-0.01</td></tr>
    <tr><td><strong>Anker 637 Magnetic Charging Station</strong></td><td>15</td><td>4.74</td><td>3.04</td><td>14.4</td><td class="diff-neg">-0.60</td></tr>
    <tr><td><strong>Spigen PowerArc ArcStation Pro</strong></td><td>15</td><td>4.54</td><td>3.04</td><td>13.79</td><td class="diff-neg">-1.21</td></tr>
  </tbody>
</table>
</div>

<style>
  table {
    border-collapse: collapse;
    width: 100%;
    min-width: 600px; /* Force scroll on mobile */
    font-family: sans-serif;
    font-size: calc(1em - 1px);
  }
  th, td {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 6px 8px;
  }
  th {
    background-color: #f2f2f2;
  }
  /* These classes control the colors and force the bold thickness */
  .bolt-5 { color: #2ecc71; font-weight: 900; -webkit-text-stroke: 1px #2ecc71; }
  .bolt-4 { color: #4ade80; font-weight: 900; -webkit-text-stroke: 1px #4ade80; }
  .bolt-3 { color: #86efac; font-weight: 900; -webkit-text-stroke: 1px #86efac; }
  .bolt-2 { color: #facc15; font-weight: 900; -webkit-text-stroke: 1px #facc15; }
  .bolt-1 { color: #f87171; font-weight: 900; -webkit-text-stroke: 1px #f87171; }
  @media (prefers-color-scheme: dark) {
    th, td {
      border-color: #2a2a2a;
    }
    th {
      background-color: #181818;
    }
  }
</style>

<div class="table-wrapper">
<table>
  <thead>
    <tr>
      <th>Charger</th>
      <th>Vpp (mV)</th>
      <th>Noise Rating (Graph 1)</th>
      <th>Ripple Rating (Graphs 2 &amp; 3)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Macbook Pro M1</strong></td>
      <td>24mV</td>
      <td><span class="bolt-5">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Anker 621 MAG GO 5000mAh Battery</strong></td>
      <td>36mV</td>
      <td><span class="bolt-5">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-4">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Spigen PowerArc ArcStation Pro</strong></td>
      <td>56mV</td>
      <td><span class="bolt-5">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-5">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Eero 15W Charger</strong></td>
      <td>60mV</td>
      <td><span class="bolt-5">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>AOHI GaN Charger</strong></td>
      <td>72mV</td>
      <td><span class="bolt-5">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-5">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Anker 637 Magnetic Charging Station</strong></td>
      <td>76mV</td>
      <td><span class="bolt-5">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-5">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Counterfeit Chinese Wall Charger</strong><span class="usba-badge">USB A Only</span></td>
      <td>84mV</td>
      <td><span class="bolt-4">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Apple 96W Macbook Charger</strong></td>
      <td>92mV</td>
      <td><span class="bolt-4">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-4">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Apple 30W Retail Charger</strong></td>
      <td>96mV</td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Anker ASPD053a</strong></td>
      <td>128mV</td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>iPhone 17 pro</strong></td>
      <td>136mV</td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Shargeek Macintosh Charger</strong></td>
      <td>152mV</td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Govee Power Supply</strong><span class="usba-badge">USB A Only</span></td>
      <td>164mV</td>
      <td><span class="bolt-2">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Dealworthy Charger</strong></td>
      <td>212mV</td>
      <td><span class="bolt-2">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-2">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Counterfeit AT&amp;T</strong><span class="usba-badge">USB A Only</span></td>
      <td>260mV</td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-3">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Amazon Kindle Charger</strong></td>
      <td>288mV</td>
      <td><span class="bolt-2">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-1">&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Apple HomePod Mini Charger</strong></td>
      <td>308mV</td>
      <td><span class="bolt-1">&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-2">&#x26A1;&#xFE0E;&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Vebner GaN 65W Charger</strong></td>
      <td>332mV</td>
      <td><span class="bolt-1">&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-1">&#x26A1;&#xFE0E;</span></td>
    </tr>
    <tr>
      <td><strong>Counterfeit Samsung</strong></td>
      <td>468mV</td>
      <td><span class="bolt-1">&#x26A1;&#xFE0E;</span></td>
      <td><span class="bolt-1">&#x26A1;&#xFE0E;</span></td>
    </tr>
  </tbody>
</table>
</div>

<p>
<style>
  body { overflow-x: hidden; }
  .device-scroller {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    position: relative;
    display: flex;
    align-items: flex-start;
    overflow-x: auto;
    gap: 30px;
    padding: 24px 10%;
    -webkit-overflow-scrolling: touch;
    height: 700px;
    box-sizing: border-box;
    scroll-behavior: smooth;
  }
  .device-scroller::-webkit-scrollbar {
    height: 16px;
  }
  .device-scroller::-webkit-scrollbar-thumb {
    background: #bbb;
    border-radius: 10px;
  }
  .device-card {
    flex: 0 0 820px;
    height: 600px;
    margin: 0;
    position: relative;
    display: flex;
    flex-direction: row;
    border-radius: 20px;
    padding: 0 0 0 42px;
    border: 1px solid rgba(0,0,0,0.08);
    box-sizing: border-box;
    overflow: hidden;
    transition: transform 0.2s ease;
  }
  .vertical-title-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 42px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 0;
  }
  .vertical-title-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    text-transform: uppercase;
    font-family: sans-serif;
    font-size: 0.95em;
    letter-spacing: 2px;
    font-weight: 800;
    color: #3a3a3a;
    text-align: center;
  }
  .device-content {
    flex: 1;
    display: flex;
    flex-direction: row;
    padding: 24px;
    gap: 24px;
    min-height: 0;
  }
  .device-images {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 0 0 400px;
  }
  .device-images img {
    width: 100%;
    height: auto;
    max-height: 290px;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid #ddd;
    background: #fff;
  }
  .device-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-height: 0;
  }
  .device-rating {
    font-size: 0.85em;
    font-family: sans-serif;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 15px;
    align-self: flex-end;
    padding: 6px 12px;
    border-radius: 8px;
    border-width: 1px;
    border-style: solid;
    font-weight: 700;
  }
  .rating-badge-5 { background: rgba(46, 204, 113, 0.12); border-color: rgba(46, 204, 113, 0.4); color: #1e8449; }
  .rating-badge-4 { background: rgba(74, 222, 128, 0.12); border-color: rgba(74, 222, 128, 0.4); color: #166534; }
  .rating-badge-3 { background: rgba(134, 239, 172, 0.12); border-color: rgba(134, 239, 172, 0.4); color: #14532d; }
  .rating-badge-2 { background: rgba(250, 204, 21, 0.12); border-color: rgba(250, 204, 21, 0.4); color: #854d0e; }
  .rating-badge-1 { background: rgba(248, 113, 113, 0.12); border-color: rgba(248, 113, 113, 0.4); color: #991b1b; }

  @media (prefers-color-scheme: dark) {
    .rating-badge-5 { background: rgba(46, 204, 113, 0.2); border-color: rgba(46, 204, 113, 0.5); color: #58d68d; }
    .rating-badge-4 { background: rgba(74, 222, 128, 0.2); border-color: rgba(74, 222, 128, 0.5); color: #4ade80; }
    .rating-badge-3 { background: rgba(134, 239, 172, 0.2); border-color: rgba(134, 239, 172, 0.5); color: #86efac; }
    .rating-badge-2 { background: rgba(250, 204, 21, 0.2); border-color: rgba(250, 204, 21, 0.5); color: #fde047; }
    .rating-badge-1 { background: rgba(248, 113, 113, 0.2); border-color: rgba(248, 113, 113, 0.5); color: #fca5a5; }
  }
  .device-card figcaption {
    font-size: 0.85em;
    font-family: sans-serif;
    line-height: 1.6;
    color: #444;
    overflow-y: auto;
    word-wrap: break-word;
    flex: 1;
    white-space: pre-wrap;
    padding-right: 12px;
  }
  .device-card figcaption::-webkit-scrollbar {
    width: 8px;
  }
  .device-card figcaption::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.03);
    border-radius: 4px;
  }
  .device-card figcaption::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
  }
  .device-card figcaption::-webkit-scrollbar-thumb:hover {
    background: rgba(0,0,0,0.15);
  }
  .expand-btn {
    align-self: flex-end;
    background: transparent;
    color: #808080;
    border: 3px solid #808080;
    padding: 10px 20px;
    border-radius: 7.5px;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 600;
    transition: all 0.2s ease;
    margin-top: 15px;
    opacity: 0.5;
  }
  .expand-btn:hover {
    background: #808080;
    color: #fff;
    opacity: 1;
  }

  /* Modal Styles */
  #device-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0);
    backdrop-filter: blur(0px);
    z-index: 10000;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 40px;
    box-sizing: border-box;
    transition: background 0.35s ease, backdrop-filter 0.35s ease;
  }
  #device-modal.modal-open {
    background: rgba(0,0,0,0.82);
    backdrop-filter: blur(6px);
  }
  #device-modal.modal-open.modal-danger {
    background: rgba(90,0,0,0.88);
    backdrop-filter: blur(6px);
  }
  .modal-dismiss-hint {
    position: absolute;
    font-family: sans-serif;
    color: rgba(255,255,255,0.55);
    font-size: 0.82em;
    letter-spacing: 1.5px;
    user-select: none;
    pointer-events: none;
  }
  .modal-dismiss-hint.top    { top: 18px;    left: 50%; transform: translateX(-50%); }
  .modal-dismiss-hint.bottom { bottom: 18px; left: 50%; transform: translateX(-50%); }
  .modal-dismiss-hint.left   { left: 18px;   top: 50%;  transform: translateY(-50%) rotate(-90deg); }
  .modal-dismiss-hint.right  { right: 18px;  top: 50%;  transform: translateY(-50%) rotate(90deg); }
  .modal-wrapper {
    position: relative;
    width: 90%;
    max-width: 1100px;
    height: calc(100vh - 120px);
    display: flex;
    flex-direction: column;
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    flex-shrink: 0;
  }
  .modal-title {
    font-family: sans-serif;
    font-size: 1.5em;
    font-weight: 700;
    color: rgba(255,255,255,0.88);
    letter-spacing: 1px;
    padding-left: 4px;
    transition: opacity 0.3s ease;
  }
  .modal-close-btn {
    background: none;
    border: none;
    color: rgba(180, 60, 60, 0.7);
    font-size: calc(1.6em + 1px);
    font-weight: 900;
    -webkit-text-stroke: 1.5px currentColor;
    cursor: pointer;
    padding: 4px 10px;
    line-height: 1;
    font-family: sans-serif;
    transition: color 0.2s ease;
    user-select: none;
  }
  .modal-close-btn:hover {
    color: rgba(220, 60, 60, 1);
  }
  .modal-container {
    background: #111;
    width: 100%;
    flex: 1;
    min-height: 0;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transform: scale(0.3);
    opacity: 0;
    transition: transform 0.45s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.35s cubic-bezier(0.76, 0, 0.24, 1);
    transform-origin: center center;
  }
  #device-modal.modal-open .modal-container {
    transform: scale(1);
    opacity: 1;
  }
  .modal-body {
    padding: 0;
    overflow: hidden;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: row;
    background: #111;
  }
  .modal-body .modal-imgs {
    display: flex;
    flex-direction: column;
    gap: 0;
    flex: 2;
    min-height: 0;
    background: #111;
  }
  .modal-body img {
    flex: 1;
    min-height: 0;
    width: 100%;
    object-fit: contain;
    cursor: zoom-in;
  }
  .modal-body p {
    font-size: 1.05em;
    font-family: sans-serif;
    line-height: 1.6;
    color: #eee;
    margin: 0;
    padding: 20px 40px 40px;
    white-space: pre-wrap;
    background: transparent;
  }
  .modal-body p::-webkit-scrollbar {
    width: 10px;
  }
  .modal-body p::-webkit-scrollbar-track {
    background: #111;
  }
  .modal-body p::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 10px;
  }
  .modal-body p::-webkit-scrollbar-thumb:hover {
    background: #444;
  }
  .modal-text-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #111;
    overflow-y: auto;
  }
  .modal-text-panel::-webkit-scrollbar {
    width: 10px;
  }
  .modal-text-panel::-webkit-scrollbar-track {
    background: #111;
  }
  .modal-text-panel::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 10px;
  }
  .modal-text-panel::-webkit-scrollbar-thumb:hover {
    background: #444;
  }
  .modal-ratings-summary {
    padding: 30px 0 10px 0;
    max-width: 354px;
    width: 100%;
    box-sizing: border-box;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .modal-ratings-summary .rating-item {
    font-family: sans-serif;
    color: #eee;
    font-size: 0.95em;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .modal-ratings-summary .label {
    font-weight: 700;
    color: #888;
    text-transform: uppercase;
    font-size: 0.85em;
    letter-spacing: 1px;
    width: 110px;
  }
  .modal-body p {
    font-size: 0.95em;
    font-family: sans-serif;
    line-height: 1.6;
    color: #888;
    margin: 0;
    padding: 20px 0 40px 0;
    max-width: 354px;
    width: 100%;
    box-sizing: border-box;
    white-space: pre-wrap;
    background: transparent;
    overflow-y: visible; /* Scroll is handled by modal-text-panel now */
  }

  /* MOBILE OPTIMIZATIONS (Smart Media Queries) */
  @media (max-width: 768px) {
    .device-scroller {
      width: 100%;
      margin-left: 0;
      margin-right: 0;
      padding: 24px 15px;
      height: 730px;
    }
    .device-card {
      flex: 0 0 calc(100vw - 30px);
      flex-direction: column;
      height: 680px;
      padding-left: 0;
    }
    .vertical-title-bar {
      position: relative;
      width: 100%;
      height: 48px;
    }
    .vertical-title-text {
      writing-mode: horizontal-tb;
      transform: none;
      font-size: 0.85em;
      letter-spacing: 1.5px;
    }
    .device-content {
      flex-direction: column;
      padding: 16px;
      gap: 16px;
    }
    .device-images {
      width: 100%;
      flex: none;
      height: 220px;
    }
    .device-info {
      padding-top: 5px;
    }
    .device-rating {
      justify-content: flex-start;
      font-size: 0.9em;
    }

    /* Modal Mobile */
    .modal-wrapper {
      width: 95%;
      height: calc(100vh - 80px);
    }
    .modal-body {
      flex-direction: column;
    }
    .modal-imgs {
      flex: none !important;
      height: 300px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .modal-text-panel {
      flex: 1;
    }
    .modal-ratings-summary {
      padding: 24px 24px 10px;
    }
    .modal-body p {
      padding: 16px 24px 32px;
    }
    .modal-dismiss-hint {
      display: none; /* Crowded on mobile */
    }
  }
</style>

<div class="device-scroller">
  {% for item in page.devices %}
  <div class="device-card" style="background: {{ item.bg }};">
    <div class="vertical-title-bar">
      <div class="vertical-title-text">{{ item.name }}</div>
    </div>
    <div class="device-content">
      <div class="device-images">
        {% if item.img1 %}
        <img src="{{ item.img1 }}" alt="{{ item.name }} 1">
        {% endif %}
        {% if item.img2 %}
        <img src="{{ item.img2 }}" alt="{{ item.name }} 2">
        {% endif %}
      </div>
      <div class="device-info">
        <div class="device-rating rating-badge-{{ item.rating }}">
          <span style="text-transform: uppercase; letter-spacing: 0.5px;">Overall rating:</span>
          <span class="bolt-{{ item.rating }}" style="font-size: 1.2em; line-height: 1;">
            {% assign rating_num = item.rating | plus: 0 %}
            {% for i in (1..rating_num) %}⚡︎{% endfor %}
          </span>
        </div>
        <figcaption>{{ item.caption | strip }}</figcaption>
        <button class="expand-btn" onclick='openModal({{ item | jsonify | escape }}, this)'>Click to Expand</button>
      </div>
    </div>
  </div>
  {% endfor %}
</div>

<div id="device-modal" onclick="closeModal()">
  <span class="modal-dismiss-hint bottom">click anywhere to dismiss</span>
  <span class="modal-dismiss-hint left">click anywhere to dismiss</span>
  <span class="modal-dismiss-hint right">click anywhere to dismiss</span>
  <div class="modal-wrapper" onclick="event.stopPropagation()">
    <div class="modal-header">
      <div id="modal-title" class="modal-title"></div>
      <button class="modal-close-btn" onclick="closeModal()" aria-label="Close modal">✕</button>
    </div>
    <div class="modal-container">
      <div id="modal-content" class="modal-body">
        <!-- Content injected by JS -->
      </div>
    </div>
  </div>
</div>

<script>
  function openModal(item, triggerBtn) {
    const modal = document.getElementById('device-modal');
    const content = document.getElementById('modal-content');

    let imgsHtml = '';
    if(item.img1) imgsHtml += `<a href="${item.img1}" target="_blank" style="display:flex; flex:1; min-height:0;"><img src="${item.img1}" alt="${item.name}"></a>`;
    if(item.img2) imgsHtml += `<a href="${item.img2}" target="_blank" style="display:flex; flex:1; min-height:0;"><img src="${item.img2}" alt="${item.name}"></a>`;

    document.getElementById('modal-title').textContent = item.name;

    const getBolts = (rating) => {
      if (rating === 'N/A' || rating === undefined || rating === null) return '<span style="color:#666; font-weight:700;">N/A</span>';
      let b = '';
      for (let i = 0; i < rating; i++) b += '⚡︎';
      return `<span class="bolt-${rating}" style="font-size: 1.3em;">${b}</span>`;
    };

    const noiseBolts = getBolts(item.noise_rating);
    const rippleBolts = getBolts(item.ripple_rating);
    const overallBolts = getBolts(item.overall_rating);

    content.innerHTML = `
      <div class="modal-imgs">${imgsHtml}</div>
      <div class="modal-text-panel">
        <div class="modal-ratings-summary">
          <div class="rating-item"><span class="label">Noise:</span> ${noiseBolts}</div>
          <div class="rating-item"><span class="label">Ripple:</span> ${rippleBolts}</div>
          <div class="rating-item"><span class="label">Overall:</span> ${overallBolts}</div>
        </div>
        <p>${(item.caption || '').trim()}</p>
      </div>
    `;

    // Set transform-origin to the card's position so it appears to grow from there
    const card = triggerBtn.closest('.device-card');
    if (card) {
      const rect = card.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      const container = modal.querySelector('.modal-container');
      container.style.transformOrigin = `${originX}px ${originY}px`;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.classList.add('modal-open');
      });
    });
  }

  function closeModal() {
    const modal = document.getElementById('device-modal');
    modal.classList.remove('modal-open');
    // Wait for transition to finish before hiding
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 350);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Backdrop hover: turn red when mouse is over the bare backdrop, not the modal content
  const modalEl = document.getElementById('device-modal');
  modalEl.addEventListener('mousemove', (e) => {
    const wrapper = modalEl.querySelector('.modal-wrapper');
    if (wrapper && wrapper.contains(e.target)) {
      modalEl.classList.remove('modal-danger');
    } else {
      modalEl.classList.add('modal-danger');
    }
  });
  modalEl.addEventListener('mouseleave', () => {
    modalEl.classList.remove('modal-danger');
  });
</script>
</p>