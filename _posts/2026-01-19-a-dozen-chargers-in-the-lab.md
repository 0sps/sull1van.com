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
    ripple_rating: 5
    overall_rating: 5

  - name: "AOHI GaN 65W Charger"
    img1: "/assets/images/AOHIGaN65W 1.png"
    img2: "/assets/images/AOHIGaN65W 3.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      Without a doubt the best AC power adapter I have ever tested. Very low noise, very low ripple, and the only noticeable peak in the FFT being the 125KHz switching frequency. I believe this charger has a new technolgoy in them that allows them to use different frequencies depending on how much power they need, so that switching frequency may be variable. But all in all, the best power supply I have ever seen.
    rating: 5
    noise_rating: 5
    ripple_rating: 5
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
      I was originally skeptical of this one, due to some prior tests that showed higher noise. This was marketed as one of the first GaN chargers, being released sometime back around 2023. Luckily my original test was flawed and subsequent runs proved that this is a very high quality charger. One of the best I've tested. 
      
      It's using a ~140KHz switching frequency, which is high enough that you can't see any ripple on the 50us graph. I zoomed out and there was a tiny amount of ripple, but not enough to be noticeable. the zoomed-out graph looks pretty similar to the one in this image, so i'm just showing you the zoomed in one here. Good charger. 
    rating: 5
    noise_rating: 5
    ripple_rating: 5
    overall_rating: 5
  - name: "Eero 15W Charger"
    img1: "/assets/images/eero.png"
    img2: "/assets/images/eero2.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      This one made me mad. For such a random charger, one that you can't even purchase yourself, it is remarkably high quality. It comes included with the Eero Some ripple exists in the switching frequency, as you can see on the bottom graph, but it does a great job at filtering out the AC nnoise. It's got a sawtooth waveform, so there is noise, but it is pretty small. 
      
      Incredible charger, especially for its size.
    rating: 5
    noise_rating: 5
    ripple_rating: 3
    overall_rating: 5
  - name: "AOHI GaN Charger"
    img1: "/assets/images/AOHI GaN2.png"
    img2: "/assets/images/AOHI GaN3.png"
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
    caption: "This is a ball-shaped charging station that offers USB A, USB C, and wireless charging outputs. While about 4 years old, it delivers top-notch power quality. You can see from the images that there is a slight bit of noise in the voltage graph, but it's nothing major. At the bottom, we see a bit of a high level of AC noise coming through (seen at bottom left of the 5ms graph) but overall the high frequency noise on this charger is quite minimal. Overall a great charger to have."
    rating: 5
    noise_rating: 5
    ripple_rating: 5
    overall_rating: 5
  - name: "Counterfeit Chinese Wall Charger (USB A Only)"
    img1: "/assets/images/Counterfeit chinese outlet 1.png"
    img2: "/assets/images/Counterfeit chinese outlet 2.png"
    bg: "hsl(90, 32%, 93%)"
    caption: "This was another charger that made me mad simply because of how good it is. It cost less than $10 and includes excellent power regulation. Low high-frequency noise and ripple. It also does a great job of providing the advertised power output. There is a bit of high-frequency ripple in the 50us graph, which I would be more concerned about if the voltage graph itself werent' great. Overall this is a solid charger to use."
    rating: 4
    noise_rating: 4
    ripple_rating: 3
    overall_rating: 4
  - name: "Apple 96W Macbook Charger"
    img1: "/assets/images/apple96W3.png"
    img2: "/assets/images/apple96W2.png"
    bg: "hsl(90, 32%, 93%)"
    caption: "Not as good as I would expect for how expensive this cahrger is. I don't believe this is a GaN based charger, but it is Apple, so I would expect high quality. The total noise is about 80mV, so it's not terribel per se, but the graph does leave some things to be desired. The power signature is a little noisy with those intermittent peaks. Not sure what the charger is having issue with here. There is also some AC noise coming through."
    rating: 4
    noise_rating: 4
    ripple_rating: 4
    overall_rating: 4
  - name: "Apple 30W Retail Charger"
    img1: "/assets/images/apple retail.png"
    img2: "/assets/images/apple retail 2.png"
    bg: "hsl(90, 32%, 93%)"
    caption: "Advertised at 30W, actual measured power was 29.5W. Solid performance, although quite confusing because it is essentially the same as the Apple HomePod Mini charger, except that you buy it separately. The Apple HomePod Mini charger was much worse."
    rating: 4
    noise_rating: 3
    ripple_rating: 3
    overall_rating: 4
  - name: "Anker ASPD053a"
    img1: "/assets/images/Anker ASP053a 3.png"
    img2: "/assets/images/Anker ASP053a 2.png"
    bg: "hsl(60, 32%, 93%)"
    caption: "This charger was alright. It was a little noisy, and doesn't look extremely well regulated. There was some AC noise coming through, and there was also some ripple at the harmonics of the switching frequency (or what I assume to be the switching frequency). It looked like it had a spike roughly every 90KHz in the FFT at the bottom of the graph."
    rating: 3
    noise_rating: 3
    ripple_rating: 3
    overall_rating: 3
  - name: "iPhone 17 pro"
    img1: "/assets/images/iphone 17 pro.png"
    bg: "hsl(60, 32%, 93%)"
    caption: "This one is rated as over-performing, only advertising 4.5W but delivering more. That's not the entire story. I configured my electronic load to pull as much current as it could before the iPhone shut off power, and that's how we got a little over 5 watts. I don't remember what it pulled when it was set up to deliver exactly 4.5 Watts. Either way, the iPhone wouldn't make a good power source, it has fairly noisy power signature. To be nice I ended up giving it 3 bolts."
    rating: 3
    noise_rating: 3
    ripple_rating: "N/A"
    overall_rating: 3
  - name: "Shargeek Macintosh Charger"
    img1: "/assets/images/Shargeek Fun Macintosh Charger.png"
    img2: "/assets/images/Shargeek Fun Macintosh Charger2.png"
    bg: "hsl(60, 32%, 93%)"
    caption: "Disappointed in this one honestly. For being nearly $30, and only pumping out 27W, this charger has a pretty awful power signature. It looks well-regulated in the sense that the waveform is repeatable and standard, but the peaks are so jagged that it is delivering a wall of noise. I would stay away from using this to charge my devices."
    rating: 3
    noise_rating: 3
    ripple_rating: 3
    overall_rating: 3
  - name: "Govee Power Supply"
    img1: "/assets/images/Govee 2.png"
    img2: "/assets/images/Govee 3.png"
    bg: "hsl(30, 32%, 93%)"
    caption: "This one is genuinely bad. It gets two bolts since it delivered *roughly* what it advertised in terms of voltage and current, but it looks poorly regulated. The voltage keeps going up and down, delivering a nonuniform power signature. It's not really a wall of noise but more like an ocean wave of noise. Not good."
    rating: 2
    noise_rating: 2
    ripple_rating: 3
    overall_rating: 2
  - name: "Dealworthy Charger"
    img1: "/assets/images/Dealworthy 1.png"
    img2: "/assets/images/Dealworthy  2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: "Awful charger, but that is to be expected for something that costs $6. Same story as before, but with more noise. Poor regulation and it shows through the noise and ripple in these graphs. Avoid."
    rating: 1
    noise_rating: 2
    ripple_rating: 2
    overall_rating: 1
  - name: "Counterfeit AT&T"
    img1: "/assets/images/Counterfeit ATnT 1.png"
    img2: "/assets/images/Counterfeit ATnT 2.png"
    bg: "hsl(30, 32%, 93%)"
    caption: "Also pretty bad, but at least it tried! This charger almost looked more uniform than other poorly performing ones (like the Govee) until I zoomed in. And wow, it looks horrible. Keep this away from your devices."
    rating: 2
    noise_rating: 3
    ripple_rating: 3
    overall_rating: 2

  - name: "Anker A121B 100W charger"
    img1: "/assets/images/Anker A121B 100w 1.png"
    img2: "/assets/images/Anker A121B 100w 2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: |
      It's better than its 45W cousin (the Anker A121D), but this charger isn't that great. It does push out the advertised voltage and current, but it does so with a wall of noise. Zooming in to the smaller timeframe is telling, as we can see little tiny voltage peaks every few microseconds. What a strange design from Anker, who claim this to be a GaN charger. It is clearly a cheaper unit.
    rating: 2
    noise_rating: 2
    ripple_rating: 2
    overall_rating: 2


  - name: "Amazon Kindle Charger"
    img1: "/assets/images/Amazon 1.png"
    img2: "/assets/images/Amazon kindle 2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: "Another awful charger. Considering the fact that this comes standard with the Kindle, I'm concerned with how the Kindle itself performs. The quality of the battery inside it might also be pretty disappointing if Amazon messed up their charger this badly."

    
    rating: 1
    noise_rating: 2
    ripple_rating: 1
    overall_rating: 1
  - name: "Apple HomePod Mini Charger"
    img1: "/assets/images/Apple Homepod Mini.png"
    img2: "/assets/images/Apple Homepod Mini 2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: "Awful. Which is surprising since this comes straight from Apple. I haven't sen many worse chargers."
    rating: 1
    noise_rating: 1
    ripple_rating: 2
    overall_rating: 1


  - name: "Vebner GaN 65W Charger"
    img1: "/assets/images/VEBNERgan.png"
    img2: "/assets/images/VEBNERgaqn2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: "Awful charging quality, but this is a fake GaN charger sold on Amazon from an alternative electronics company known as Vebner. They are a real company, but the truth around their GaN claims is questionable."
    rating: 1
    noise_rating: 1
    ripple_rating: 1
    overall_rating: 1

  - name: "Anker A121D 45w iPhone 17 charger"
    img1: "/assets/images/Anker A121D 45w iPhone 17 charger 1.png"
    img2: "/assets/images/Anker A121D 45w iPhone 17 charger 3.png"
    bg: "hsl(0, 32%, 93%)"
    caption: |
      Is this even GaN???

      This is easily the most disappointing charger of the bunch. Anker JUST released this (late 2025) and couldn't help themselves from marketing just how amazing it was. How it used GaN, how it supports PPS, etc. But this charger is just awful. 

      The only good thing I can say about this charger is that it does output its advertised voltage and current. Aside from that, it's awful. Noise everywhere, and a constant high-voltage whine that you can see in the lower timeframe. At that lower timeframe, it's also unclear what the charger is actually *doing*. It seems to be constantly sending out various voltages, somewhat resembling a sawtooth but constantly going back and forth. After some research, I believe this was a decision of Anker's to actually avoid newer GaN materials and use older switching technology, relying on aggressive Frequency Dithering to help ease the noise. This may not be the case but it is my suspicion. 

      Either way, it is awful!

      Sidenote: you would be right to point out that earlier I mentioned the AOHI GaN chargers have the ability to change their switching frequency as needed. You may be saying, *how is that any different from what you are saying Anker did here?* It's a valid question. The difference is that Anker clearly had too much noise at the switching frequency of the charger, which I'm estimating to be 90KHz, and they needed to spread that noise out. So they DO employ the same technology, but they switch constantly, but only vary it by 20-50KHz. Constantly moving the switching freuqency up and down, so the noise spreads out and doesn't make any one peak so high that it fails regulatory testing. On the other hand, AOHI decided to manage thier noise entirely, so when they change the switching freuqency, it's only happening once when the charger starts sending a certain level of power. They probably only change it when the voltage changes, to make sure they can best accomodate the power. And then at lower voltage levels, I suspect they go down to a lower switching freuqency to save on electricity. They don't need to constantly switch up and down, because their aim isn't to spread noise out. 
    rating: 1
    noise_rating: 1
    ripple_rating: 1
    overall_rating: 1

  - name: "Counterfeit Samsung"
    img1: "/assets/images/Counerfeit Samsung 1.png"
    img2: "/assets/images/Counerfeit Samsung 2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: |
      Easily the worst one of the bunch. While the original resarcher (Ken Shirriff) doubled his scale to show the graph of his worst charger, I wanted to evalueate all my chargers on the same scale, so you can see how bad some of these really are. Looking at the image, it's tough to figure out what this charger is even trying to do. Is it trying to send any specific voltage, or just throw some power around? 
      
      Another issue I noticed was overcurrent. This was the only device I tested that would happily pump out more current than advertised. It achieved this by dropping the voltage to something disgustingly low, and definitely not a level that would be accpetable for a modern device. I knew this would be bad, but it's validating to have the graphs to show it.
    rating: 1
    noise_rating: 1
    ripple_rating: 1
    overall_rating: 1
---

## A Dozen Chargers in the Lab: Apple is Okay, but Not the Best

<!-- INTRO: Write your opening paragraph(s) here. Why did you test this? What inspired you? (e.g. Ken Shirriff) What is the reader going to learn? -->
*(As of 3/11/26 this page is still being finished, expect inaccuracies)*

Have you ever wondered about the quality of phone chargers? Whether  counterfeit chargers were secretly destroying your battery? That's what I'd wondered for years ever since I read a [blog post by one legendary Google engineer Ken Shirriff](https://www.righto.com/2012/10/a-dozen-usb-chargers-in-lab-apple-is.html). It was at the top of [Hacker News](https://news.ycombinator.com/) one morning. I believe I was a freshman in college at the time when I read it. Most of it went over my head, but I did start thinking about what kinds of chargers I should keep around, and which I should avoid. 

Fast forward six years, and the story had been relegated to an occasional thought in my head. Ken's work only covered the USB A chargers at the time, not USB C. I wondered what modern chargers would be like if I tested them in the same way. I couldn't find anyone online who replicated Ken's work in the same way, it just felt like this information *needed* to be out there in the world but just didn't exist yet.

Having thought about it on and off for years, I had a conversastion with my manager at work one day, talking about our hobbies outside of work. I mentioned that now that I finished doing some extensive journaling (90,000 words), and coding a Comma 3X to work with my new car, I needed something else to do. We talked about the charger project and I told him that it would be a good project to work on. He said I should do it. I looked at him and sadi that I would. And like that, I devided it would happen. So two months later, here we are.

---

## What I Tested

<!-- Briefly describe the collection of chargers — where they came from (official, counterfeit, old, new, etc.) -->

I tested nearly two dozen USB C chargers. I also added in some USB A chargers as well.

To clarify some confusion in how I've been referring to them: USB A is the rectangular connector we used to have on old chargers, and USB C is the round, modern plug. 

---

## How I Tested Them

<!-- Describe your methodology: the oscilloscope, what Vpp means, what noise/ripple means and why it matters, etc. A paragraph or two here will make the rest of the article make sense. -->

As it turns out, testing USB C cables is incredibly complex. Ever since the USB C Power Delivery standard came out, a standard USB Charger is capable of putting out many different voltages.

As a brief refrehser, these chargers are outputting a specific voltage and then a variable amount of current. So the device negotiates a voltage with the charger, and once they agree on that the charger just tries to maintain that specific voltage regardless of what current the device pulls. The device decides how much current to pull. The charger's job is to supply current at a constant voltage until the device asks for too much current, which the charger reacts to by shutting off.

Well, with USB A, you only have one voltage to test. With USB C Power Delivery, you have up to 4. And with more modern extensinos of this standard coming online, new chargers (ones that I don't have) are supporting more and more voltages. Some offer dozens. 

This means that my work will be like Ken's, except 2-4x more data points. Let's go.


### Testing setup

My setup consisted of three distinct pieces:
1. An oscilloscope, specifically the Rigol DS1054Z,
2. An electronic load
3. A USB C Power Delivery decoy board

I would plug the charger into the wall, conect it to the USB C decoy board via USB C. The decoy board imitates a device and requests a specific voltage from the USB C charger. *Ken didn't need this piece since his chargers were constant voltage, but mine unfortunately do require it.* From there, the decoy board had a positive and negative terminal which were connected to the electronic load with small wires.

The Rigol DS1054Z was set up with its probe touching the positive terminal on the decoy board, and its ground touching the negative terminal. I used the spring-based ground clip instead of the alligator ground clip for more accurate measurements.


---

## The Results

<!-- Introduce the interactive card viewer below. Something like "Scroll through the results below — click any card to expand the oscilloscope traces." -->

I started by testing all the chargers at all their advertised voltages, then noticed that the waveforms looked *exactly the same* regardless of voltage. The only indicator of a differing waveform was current. So I therefore tried to take a lower voltage but pull differing currents until I got the worst looking graph. In that respect, the graphs I captured below should represent the worst state of that specific charger. The caveat here is that I only tested up to ~30W, and some chargers support up to 100W, but my wires and breakout boards weren't big enough to handle that kind of power.

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
  /* Bolt colors: evenly-spaced red→orange→amber→lime→green gradient */
  .bolt-5 { color: #15933f; font-weight: 900; -webkit-text-stroke: 1px #15933f; }
  .bolt-4 { color: #7ad025; font-weight: 900; -webkit-text-stroke: 1px #7ad025; }
  .bolt-3 { color: #f2c336; font-weight: 900; -webkit-text-stroke: 1px #f2c336; }
  .bolt-2 { color: #f08b42; font-weight: 900; -webkit-text-stroke: 1px #f08b42; }
  .bolt-1 { color: #e02929; font-weight: 900; -webkit-text-stroke: 1px #e02929; }
  @media (prefers-color-scheme: dark) {
    th, td {
      border-color: #2a2a2a;
    }
    th {
      background-color: #181818;
    }
    /* Bright gradient for dark table backgrounds */
    table .bolt-5 { color: #42d773; -webkit-text-stroke: 1px #42d773; }
    table .bolt-4 { color: #8cd742; -webkit-text-stroke: 1px #8cd742; }
    table .bolt-3 { color: #eebd2b; -webkit-text-stroke: 1px #eebd2b; }
    table .bolt-2 { color: #f08b42; -webkit-text-stroke: 1px #f08b42; }
    table .bolt-1 { color: #e96363; -webkit-text-stroke: 1px #e96363; }
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
    overflow-x: scroll;
    gap: 30px;
    padding: 24px 10%;
    padding-bottom: 10px;
    -webkit-overflow-scrolling: touch;
    height: 645px;
    box-sizing: border-box;
    scroll-behavior: smooth;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .device-scroller::-webkit-scrollbar {
    display: none;
  }

  /* Custom scrollbar - always visible */
  .custom-scroll-area {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    padding: 0 10%;
    box-sizing: border-box;
    position: relative;
    height: 30px;
    display: flex;
    align-items: center;
    margin-top: -6px;
  }
  .custom-scroll-track {
    width: 100%;
    height: 8px;
    background: rgba(150, 150, 150, 0.35);
    border-radius: 4px;
    position: relative;
    cursor: pointer;
  }
  .custom-scroll-thumb {
    position: absolute;
    height: 22px;
    top: 50%;
    transform: translateY(-50%);
    background: #999;
    border-radius: 11px;
    cursor: grab;
    min-width: 60px;
    transition: background 0.15s ease;
  }
  .custom-scroll-thumb:hover {
    background: #777;
  }
  .custom-scroll-thumb:active {
    background: #666;
    cursor: grabbing;
  }
  .quality-labels-bar {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    display: flex;
    justify-content: space-between;
    padding: 2px 10%;
    box-sizing: border-box;
    opacity: 0.7;
    font-family: sans-serif;
    font-size: 0.78em;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #888;
    user-select: none;
    pointer-events: none;
    margin-top: 2px;
  }
  .card-column {
    flex: 0 0 820px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .card-title-above {
    font-family: sans-serif;
    font-size: 1.05em;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2.5px;
    color: rgba(0, 0, 0, 0.65);
    padding-left: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    user-select: none;
  }
  @media (prefers-color-scheme: dark) {
    .card-title-above {
      color: rgba(255, 255, 255, 0.25);
    }
  }
  .device-card {
    flex: 1;
    height: 565px;
    margin: 0;
    position: relative;
    display: flex;
    flex-direction: row;
    border-radius: 20px;
    padding: 0;
    border: 1px solid rgba(0,0,0,0.08);
    box-sizing: border-box;
    overflow: hidden;
    transition: transform 0.2s ease;
  }
  .vertical-title-bar {
    display: none;
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
    cursor: pointer;
  }
  .device-images {
    display: flex;
    flex-direction: column;
    justify-content: center;
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
  .rating-badge-5 { background: rgba(46, 204, 113, 0.22); border-color: rgba(46, 204, 113, 0.55); color: #145a30; }
  .rating-badge-4 { background: rgba(74, 222, 128, 0.22); border-color: rgba(74, 222, 128, 0.55); color: #166534; }
  .rating-badge-3 { background: rgba(134, 239, 172, 0.22); border-color: rgba(134, 239, 172, 0.55); color: #14532d; }
  .rating-badge-2 { background: rgba(250, 204, 21, 0.22); border-color: rgba(250, 204, 21, 0.55); color: #854d0e; }
  .rating-badge-1 { background: rgba(248, 113, 113, 0.22); border-color: rgba(248, 113, 113, 0.55); color: #991b1b; }

  @media (prefers-color-scheme: dark) {
    /* Card bg is light pastel in both modes, so dark text colors stay the same */
    .rating-badge-5 { background: rgba(46, 204, 113, 0.22); border-color: rgba(46, 204, 113, 0.55); color: #145a30; }
    .rating-badge-4 { background: rgba(74, 222, 128, 0.22); border-color: rgba(74, 222, 128, 0.55); color: #166534; }
    .rating-badge-3 { background: rgba(134, 239, 172, 0.22); border-color: rgba(134, 239, 172, 0.55); color: #14532d; }
    .rating-badge-2 { background: rgba(250, 204, 21, 0.22); border-color: rgba(250, 204, 21, 0.55); color: #854d0e; }
    .rating-badge-1 { background: rgba(248, 113, 113, 0.22); border-color: rgba(248, 113, 113, 0.55); color: #991b1b; }
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
    margin-top: auto;
    background: rgba(0, 0, 0, 0.04);
    color: #555;
    border: 1px solid rgba(0, 0, 0, 0.12);
    padding: 10px 44px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 700;
    font-family: sans-serif;
    text-transform: uppercase;
    letter-spacing: 1.8px;
    transition: color 0.25s ease, background 0.25s ease, border-color 0.25s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .expand-btn::after {
    content: '→';
    display: inline-block;
    font-size: 1.1em;
    transition: color 0.25s ease;
  }
  .expand-btn:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #222;
    border-color: rgba(0, 0, 0, 0.25);
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
    display: grid;
    grid-template-columns: 3fr 2fr;
    background: #111;
  }
  .modal-body .modal-imgs {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 0;
    background: #111;
    overflow: hidden;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #111;
    overflow-y: auto;
    min-height: 0;
    padding: 0 10px 0 15px;
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
  .modal-close-bottom {
    display: none;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 18px;
    margin: 0;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.7);
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-family: sans-serif;
    font-size: 0.9em;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
    cursor: pointer;
    flex-shrink: 0;
  }

  /* MOBILE OPTIMIZATIONS (Smart Media Queries) */
  @media (max-width: 768px) {
    .device-scroller {
      padding: 24px 15px 10px 15px;
      height: 666px;
      align-items: stretch;
    }
    .card-column {
      flex: 0 0 calc(100vw - 30px);
      flex-shrink: 0;
      height: 100%;
    }
    .card-title-above {
      padding: 4px 12px;
      text-align: center;
      font-size: 0.75em;
      white-space: normal;
      line-height: 1.3;
      color: rgba(180, 180, 180, 0.85);
      border: 1.5px solid rgba(180, 180, 180, 0.4);
      border-radius: 8px;
      align-self: center;
    }
    .device-card {
      flex-direction: column;
      height: auto;
      flex: 1;
      padding-left: 0;
    }
    .vertical-title-bar {
      display: none;
    }
    .device-content {
      flex-direction: column;
      padding: 16px;
      gap: 12px;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .device-images {
      width: 100%;
      flex: 0 0 200px;
      overflow: hidden;
    }
    .device-images img {
      flex: 1;
      min-height: 0;
      height: 0;
      max-height: none;
      object-fit: cover;
      background: #111;
      border-color: transparent;
    }
    .device-info {
      padding-top: 0;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    .device-rating {
      align-self: flex-start;
      justify-content: flex-start;
      font-size: 0.9em;
    }
    .expand-btn {
      align-self: stretch;
      justify-content: center;
      padding: 10px 20px;
    }

    /* Modal Mobile - Full-screen scrollable layout */
    #device-modal {
      padding: 0;
    }
    .modal-wrapper {
      width: 100%;
      height: 100%;
      max-width: none;
    }
    .modal-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10;
      background: linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 70%, transparent 100%);
      padding: 12px 16px;
      margin-bottom: 0;
    }
    .modal-title {
      font-size: 1.1em;
    }
    .modal-container {
      border-radius: 0;
      height: 100%;
    }
    .modal-body {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    .modal-body .modal-imgs {
      flex: none;
      height: auto;
      border-bottom: none;
      padding-top: 60px;
    }
    .modal-body .modal-imgs a {
      display: block !important;
      flex: none !important;
    }
    .modal-body img {
      flex: none;
      width: 100%;
      height: auto;
      max-height: 45vh;
      object-fit: contain;
      background: #000;
    }
    .modal-text-panel {
      flex: none;
      overflow-y: visible;
      padding: 0 20px;
      align-items: flex-start;
    }
    .modal-ratings-summary {
      padding: 20px 0 10px 0;
      max-width: none;
    }
    .modal-body p {
      padding: 12px 0 20px 0;
      max-width: none;
      font-size: 0.9em;
    }
    .modal-close-bottom {
      display: flex;
    }
    .modal-dismiss-hint {
      display: none;
    }
    .custom-scroll-area {
      padding: 0 15px;
      margin-top: -2px;
    }
    .quality-labels-bar {
      padding: 4px 15px;
      font-size: 0.72em;
      letter-spacing: 2px;
    }
  }
</style>

<div class="device-scroller" id="deviceScroller">
  {% for item in page.devices %}
  <div class="card-column">
    <div class="card-title-above">{{ item.name }}</div>
    <div class="device-card" style="background: {{ item.bg }};">
      <div class="vertical-title-bar">
        <div class="vertical-title-text">{{ item.name }}</div>
      </div>
      <div class="device-content" onclick='openModal({{ item | jsonify | escape }}, this)'>
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
          <button class="expand-btn">Expand</button>
        </div>
      </div>
    </div>
  </div>
  {% endfor %}
</div>

<div class="custom-scroll-area">
  <div class="custom-scroll-track" id="customTrack">
    <div class="custom-scroll-thumb" id="customThumb"></div>
  </div>
</div>
<div class="quality-labels-bar">
  <span>←← BETTER</span>
  <span>WORSE →→</span>
</div>

<div id="device-modal" onclick="closeModal()">
  <span class="modal-dismiss-hint bottom">click anywhere to dismiss</span>
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
      <button class="modal-close-bottom" onclick="closeModal()">CLOSE</button>
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

  // ─── Custom Scrollbar Sync ───
  (function() {
    const scroller = document.getElementById('deviceScroller');
    const track = document.getElementById('customTrack');
    const thumb = document.getElementById('customThumb');
    if (!scroller || !track || !thumb) return;

    function updateThumb() {
      const scrollableWidth = scroller.scrollWidth - scroller.clientWidth;
      if (scrollableWidth <= 0) {
        thumb.style.display = 'none';
        return;
      }
      thumb.style.display = 'block';
      const trackWidth = track.clientWidth;
      const thumbWidth = Math.max(60, (scroller.clientWidth / scroller.scrollWidth) * trackWidth);
      const scrollPercent = scroller.scrollLeft / scrollableWidth;
      const maxThumbLeft = trackWidth - thumbWidth;
      thumb.style.width = thumbWidth + 'px';
      thumb.style.left = (scrollPercent * maxThumbLeft) + 'px';
    }

    scroller.addEventListener('scroll', updateThumb);
    window.addEventListener('resize', updateThumb);

    // Drag support
    let isDragging = false;
    let dragStartX = 0;
    let dragStartLeft = 0;

    thumb.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartLeft = parseFloat(thumb.style.left) || 0;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const trackWidth = track.clientWidth;
      const thumbWidth = thumb.clientWidth;
      const maxThumbLeft = trackWidth - thumbWidth;
      const newLeft = Math.max(0, Math.min(maxThumbLeft, dragStartLeft + dx));
      const scrollPercent = newLeft / maxThumbLeft;
      const scrollableWidth = scroller.scrollWidth - scroller.clientWidth;
      scroller.scrollLeft = scrollPercent * scrollableWidth;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    });

    // Click on track to jump
    track.addEventListener('click', (e) => {
      if (e.target === thumb) return;
      const rect = track.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const trackWidth = track.clientWidth;
      const thumbWidth = thumb.clientWidth;
      const targetLeft = clickX - thumbWidth / 2;
      const maxThumbLeft = trackWidth - thumbWidth;
      const scrollPercent = Math.max(0, Math.min(1, targetLeft / maxThumbLeft));
      const scrollableWidth = scroller.scrollWidth - scroller.clientWidth;
      scroller.scrollLeft = scrollPercent * scrollableWidth;
    });

    // Touch drag support
    thumb.addEventListener('touchstart', (e) => {
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartLeft = parseFloat(thumb.style.left) || 0;
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - dragStartX;
      const trackWidth = track.clientWidth;
      const thumbWidth = thumb.clientWidth;
      const maxThumbLeft = trackWidth - thumbWidth;
      const newLeft = Math.max(0, Math.min(maxThumbLeft, dragStartLeft + dx));
      const scrollPercent = newLeft / maxThumbLeft;
      const scrollableWidth = scroller.scrollWidth - scroller.clientWidth;
      scroller.scrollLeft = scrollPercent * scrollableWidth;
    }, { passive: true });

    document.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Initial render
    setTimeout(updateThumb, 100);
    // Also update after images load
    scroller.querySelectorAll('img').forEach(img => {
      img.addEventListener('load', updateThumb);
    });
  })();
</script>
</p>