---
layout: post
title: "A Dozen Chargers in the Lab"
date: 2026-01-19
tags: [technology]
devices:
  - name: "Macbook Pro M1"
    img1: "/assets/images/macbook pro 1.png"
    img2: "/assets/images/macbook pro 2.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      The MacBook Pro had some of the cleanest power of the devices I tested. This is pretty unsurprising since it's just pulling DC current from its internal battery, and it doesn't have to chop up AC power like the chargers do.
      
      There's also no high frequency switching noise. This makes sense, since it doesn't have to switch thousands of times a second to step down AC voltage into something manageable.
    rating: 5
    noise_rating: 5
    ripple_rating: 5
    overall_rating: 5
    noise_mv: 24

  - name: "AOHI GaN 65W Charger"
    img1: "/assets/images/AOHIGaN65W 3.png"
    img2: "/assets/images/AOHIGaN65W 1.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      Without a doubt the best AC power adapter. Very low noise, very low ripple. The only noticeable peak in the FFT is the 125KHz switching frequency. I believe this charger has a new technology in them that allows it to use different switching frequencies depending on how much power is requested, so the switching frequency may change with time. But all in all, the best power supply I have seen.
    rating: 5
    noise_rating: 5
    ripple_rating: 5
    overall_rating: 5
    noise_mv: 60



  - name: "Anker 621 MAG GO 5000mAh Battery"
    img1: "/assets/images/Anker a1654 Maggo power bank.png"
    img2: "/assets/images/Anker a1654 Maggo power bank 2.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      No switching noise or ripple seen here. The one small issue in my testing was that it measured 4.74V, just barely under the 4.75V USB limit. That's a tiny miss and doesn't affect real-world usability, but it was enough to mark it red in my table. The power quality itself is excellent so I'll keep it at a high rating.
    rating: 5
    noise_rating: 5
    ripple_rating: 5
    overall_rating: 5
    noise_mv: 36

  - name: "Spigen PowerArc ArcStation Pro"
    img1: "/assets/images/Spigen PowerArc 1.png"
    img2: "/assets/images/Spigen PowerArc 2.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      I was originally skeptical of this one, due to my first few tests being pretty bad. Turns out it was an issue on my side, and all subsequent tests have been great. 
      
      This was marketed as one of the first GaN chargers, having been released sometime back in 2023. It's using a ~140KHz switching frequency, which seems to be the only source of switching ripple on the 50us graph. I zoomed out and there was a tiny amount of additional noise on the FFT, but not enough to be truly noticeable. The zoomed-out graph looks pretty similar to the one in this image, so I'm just showing you the zoomed in one here. Good charger. 
    rating: 5
    noise_rating: 5
    ripple_rating: 5
    overall_rating: 5
    noise_mv: 56
  - name: "Eero 15W Charger"
    img1: "/assets/images/eero.png"
    img2: "/assets/images/eero2.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      This one confused me. For such a random charger, one that you can't even purchase yourself, it is of pretty high quality. It comes included with Eero devices, and looks to be custom-built just for them. I'm not sure if Amazon/Eero bought this one off the shelf and rebranded it or it's their own circuit design.
      
      Some switching ripple exists, as you can see on the bottom graph, but it does a great job at filtering out most other noise. It also has a sawtooth waveform, so there is noise, but it is pretty small. Good charger!
    rating: 4
    noise_rating: 5
    ripple_rating: 3
    overall_rating: 4
    noise_mv: 60
  - name: "AOHI GaN 100W Charger"
    img1: "/assets/images/AOHIGaN100w 1.png"
    img2: "/assets/images/AOHIGaN100w 3.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      This one performed very well. From my research, this is a GaN charger that uses some components that are so new they have never been used in consumer chargers before. This charger should really be considered a flagship for how much effort they put into it. For that reason, I'm a little disappointed the power signature isn't better. It IS good, but for how bleeding-edge this charger is supposed to be, it performs comparably to chargers half its size and price.

      The really cool thing about this charger is that it supports PPS and has the ability to step the voltage in small increments, when needed by the device. I didn't test this, but it does have that capability.
      
      One truly interesting thing about this charger was how it managed its voltage. At low current, it hovered around 12V exactly. But as the current approached the 2-3A range, the voltage rose with current, topping out at 12.36V when I pulled 3A. This is the first charger I tested that dynamically increased its voltage to account for resistance in the charging system. Absolutely incredible.
    rating: 5
    noise_rating: 4
    ripple_rating: 5
    overall_rating: 5
    noise_mv: 72
  - name: "Anker 637 Magnetic Charging Station 2 - USB C Port"
    img1: "/assets/images/Anker 637 magnetic charging station USB C.png"
    img2: "/assets/images/Anker 637 magnetic charging station USB C 2.png"
    bg: "hsl(120, 32%, 93%)"
    caption: |
      This is a ball-shaped charging station that offers USB A, USB C, and wireless charging outputs. While about 4 years old, it delivers quite clean power. The voltage trace is fairly tight with only minor noise, so nothing alarming.
      
      As you can tell, this is only the test of the USB C port. I didn't bother testing the noise of the USB A port for two reasons: one, they sit on the same circuit board so they likely share the same voltage regulation, and two, most people will not be using the USB A port on this.

      One other interesting note about this charger: During overcurrent testing, it happily provided far above its rated current. I suspect it is because this specific charger has these configurations:  
      1) 5v 3a, 
      2) 9v 3a, 
      3) 12v 3a, 
      4) 15v 3a, 
      5) 20v 3.25a

      As you can see, it will actually go above 3 A at the highest voltage. I think they just didn't think anyone would actually use over 3 A at the lower voltages. It was able to happily provide current all the way until shutoff that was within the +/- 5% of voltage spec, as per USB standards. So even though it pumps out way more current than advertised, I don't see it as a necessarily bad thing.

      
    rating: 5
    noise_rating: 5
    ripple_rating: 4
    overall_rating: 5
    noise_mv: 76


  - name: "Counterfeit Chinese Wall Charger (USB A Only)"
    img1: "/assets/images/Counterfeit chinese outlet 1.png"
    img2: "/assets/images/Counterfeit chinese outlet 2.png"
    bg: "hsl(90, 32%, 93%)"
    caption: "This was another charger that surprised me simply because of how well it tested under the oscilloscope. It cost less than $10 and has very low high-frequency noise and ripple. There is a bit of high-frequency noise in the 50us graph, which I would be more concerned about if the voltage itself wasn't stable. In all, this charger would seem to be great. The only issue is that it was 0.5V below the 5V threshold during testing, which puts it out of spec for a USB Charger. I give it 1 bolt because of this."
    rating: 1
    noise_rating: 4
    ripple_rating: 3
    overall_rating: 1
    noise_mv: 84


  - name: "Apple 96W Macbook Charger"
    img1: "/assets/images/apple96W3.png"
    img2: "/assets/images/apple96W2.png"
    bg: "hsl(90, 32%, 93%)"
    caption: "Good, but I would expect a little bit better for how expensive this charger is. I don't believe this is a GaN charger, but it is Apple, so it should be high quality. The total noise is low at 92mV, but there is some noise visible within those intermittent peaks when you go into the lower timeframe. There's also high-frequency ripple with plenty of harmonics. Lastly, it also delivered less voltage than advertised, going down to 8.63V when I would try to pull 9V and 3A. Overall rating is a 3 because of that high-frequency noise and the voltage sag. Again, not bad, but we should expect better for the price."
    rating: 3
    noise_rating: 4
    ripple_rating: 4
    overall_rating: 3
    noise_mv: 92


  - name: "Apple 30W Retail Charger"
    img1: "/assets/images/apple retail.png"
    img2: "/assets/images/apple retail 2.png"
    bg: "hsl(90, 32%, 93%)"
    caption: |
      Another decent Apple charger. At 5 W (5V, 1A), it has a pretty messy power signature with a lot of noise, but the voltage graph flattens out to this nice, smooth line at 7.5 W and above. I imagine this happened because nobody at Apple expected customers to use this charger for 5 W of power, being USB C, and designed it accordingly. 
      
      I also tested this 7.5 W in different forms: 5V 1.5A, and also 15V 0.5A. In both 15V and 5V modes, I needed to achieve a grand total of AT LEAST 7.5 Watts before the charger noise dropped out into the graph you see here. I displayed the 7.5 W+ graph because in normal usage you will almost never encounter that noise, since Apple devices almost always pull more than that during normal charging. 
      
      I'll give it an overall rating of a 4 as it's a solid charger for typical use cases - providing you don't trickle charge with it.
    rating: 4
    noise_rating: 3
    ripple_rating: 3
    overall_rating: 4
    noise_mv: 96


  - name: "Anker ASPD053a"
    img1: "/assets/images/Anker ASP053a 3.png"
    img2: "/assets/images/Anker ASP053a 2.png"
    bg: "hsl(60, 32%, 93%)"
    caption: "Not that impressive. The voltage is noticeably noisier than a lot of my other chargers. The frequency spectrum also shows ripple with harmonics at roughly 90KHz intervals. Not awful, but not a charger I'd reach for if I had better options nearby."
    rating: 3
    noise_rating: 3
    ripple_rating: 3
    overall_rating: 3
    noise_mv: 128


  - name: "iPhone 17 pro"
    img1: "/assets/images/iphone 17 pro.png"
    bg: "hsl(60, 32%, 93%)"
    caption: |
      Since it is fairly noisy, I wouldn't advertise the iPhone as a viable charging device. To be nice I ended up giving it 3 bolts.
    rating: 3
    noise_rating: 3
    ripple_rating: "N/A"
    overall_rating: 3
    noise_mv: 136


  - name: "Shargeek Macintosh Charger"
    img1: "/assets/images/Shargeek Fun Macintosh Charger.png"
    img2: "/assets/images/Shargeek Fun Macintosh Charger3.png"
    bg: "hsl(60, 32%, 93%)"
    caption: "Disappointed in this one. For being nearly $30, and only pumping out 27W, this charger isn't doing that well. It looks well-regulated in the sense that the waveform is repeatable and standard, but the peaks are so jagged that it is delivering a lot of noise. I would stay away from using this to charge my devices."
    rating: 3
    noise_rating: 3
    ripple_rating: 3
    overall_rating: 3
    noise_mv: 152



  - name: "Govee Power Supply"
    img1: "/assets/images/Govee 3.png"
    img2: "/assets/images/Govee 2.png"
    bg: "hsl(30, 32%, 93%)"
    caption: "As expected, not great. This Govee gets two bolts since it delivered *roughly* what it advertised in terms of voltage and current, but it looks noisy. The voltage keeps going up and down, delivering a nonuniform power signature. It's delivering something like an ocean wave of noise. Not good."
    rating: 2
    noise_rating: 2
    ripple_rating: 2
    overall_rating: 2
    noise_mv: 164


    
  - name: "Dealworthy Charger"
    img1: "/assets/images/Dealworthy 1.png"
    img2: "/assets/images/Dealworthy 3.png"
    bg: "hsl(0, 32%, 93%)"
    caption: |
      Dealworthy is a Target brand, and it's designed to be low cost. You can see just how cheaply it's been made by these graphs. Lots of noise, poor regulation, and a lot of switching ripple with harmonics all over the FFT.
    
      Another thing I want to mention is that they appear to be smearing the switching frequency by doing some kind of frequency dithering. It's operating at 40KHz, but I suspect it is going slightly above and below that frequency to spread out the massive amount of noise it makes.
    rating: 1
    noise_rating: 2
    ripple_rating: 2
    overall_rating: 1
    noise_mv: 212



  - name: "Counterfeit AT&T"
    img1: "/assets/images/Counterfeit ATnT 1.png"
    img2: "/assets/images/Counterfeit ATnT 2.png"
    bg: "hsl(30, 32%, 93%)"
    caption: Bad. A quick glance on the 5ms timeframe and the voltage almost looks normal, but zooming in reveals a waveform dense with high-frequency noise and severe peaks. There is also meaningful ripple in the lower timeframe. The voltage also measured 5.38V, so it is technically out of the acceptable range for a USB charger. I will give it 1 lightning bolt.
    rating: 1
    noise_rating: 1
    ripple_rating: 2
    overall_rating: 1
    noise_mv: 260

  - name: "Anker A121B 100W Charger"
    img1: "/assets/images/Anker A121B 100w 1.png"
    img2: "/assets/images/Anker A121B 100w 2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: |
      This is a "GaN" flagship charger released by anker sometime in late 2025. They hype it up so much on their website that I was looking to be impressed. And after testing it, I can say I am definitely surprised! But not impressed.
      
      It's better than its 45W cousin (the Anker A121D), but this charger isn't that great. It does push out the advertised voltage and current, but it does so with a wall of noise. Zooming in to the smaller timeframe is telling, as we can see little tiny voltage peaks every few microseconds. What a strange design from Anker, who claim this to be a GaN charger. It is clearly not made that well.
    rating: 2
    noise_rating: 2
    ripple_rating: 2
    overall_rating: 2
    noise_mv: 200


  - name: "Amazon Kindle Charger"
    img1: "/assets/images/Amazon 1.png"
    img2: "/assets/images/Amazon kindle 2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: "Another awful charger. Considering this comes as the standard Kindle charger, it is a poor showing from Amazon. The voltage is wide and noisy, with a chaotic high-frequency spectrum. It also measured 5.30V when I tested the output voltage, well above the 5.25V USB ceiling and therefore out of spec for a USB charger. If the graphs weren't bad enough, the bad voltage would give it 1 bolt."
    rating: 1
    noise_rating: 1
    ripple_rating: 2
    overall_rating: 1
    noise_mv: 288
  - name: "Apple HomePod Mini Charger"
    img1: "/assets/images/Apple Homepod Mini.png"
    img2: "/assets/images/Apple Homepod Mini 2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: |
      Disappointing, especially given that this ships directly from Apple. The voltage is thick and irregular, and shows signs of both low-frequency and high-frequency ripple at a glance. On the bottom of the screen, the frequency spectrum shows elevated noise across the board. Its noise is at 308mV peak-to-peak and it ranks among the worst chargers in this entire test. 
      
      I was really surprised by this test. I also happened to have two of these chargers, one from a HomePod and one from an iPhone of years past. This charger is actually the same as the Apple 20W [you can buy directly from their website](https://www.apple.com/shop/product/mwvv3am/a/20w-usb-c-power-adapter). And while you could, I have no idea why you would want to do that. $20 can get you a much better charger than this.
    rating: 1
    noise_rating: 1
    ripple_rating: 2
    overall_rating: 1
    noise_mv: 308


  - name: "Vebner GaN 65W Charger"
    img1: "/assets/images/VEBNERgan.png"
    img2: "/assets/images/VEBNERgaqn2.png"
    bg: "hsl(0, 32%, 93%)"
    caption: |
      Being marketed as a GaN charger, this is another disappointment. The voltage has a lot of noise, 332mV to be exact, and the frequency spectrum is elevated across the board, showing no serious attempt at filtering. The voltage looks a little more concentrated than it does on the Apple HomePod Mini chart, suggesting to me that this charger might actually be a little better. But in terms of absolute noise, this is worse. 


    rating: 1
    noise_rating: 1
    ripple_rating: 1
    overall_rating: 1
    noise_mv: 332

  - name: "Anker A121D 45W iPhone 17 charger"
    img1: "/assets/images/Anker A121D 45w iPhone 17 charger 1.png"
    img2: "/assets/images/Anker A121D 45w iPhone 17 charger 3.png"
    bg: "hsl(0, 32%, 93%)"
    caption: |
      Is this even GaN???

      Easily the most disappointing charger of the bunch. Anker JUST released this (late 2025) and couldn't help themselves from marketing just how amazing it was. How it used GaN, how it supports PPS, how it can bring endless joy and happiness to your life. But this charger is just awful. 

      The only good thing I can say about this charger is that it does output its advertised voltage and current. Aside from that, it's awful. Noise everywhere, and constant high-voltage spikes that you can see in the lower timeframe. Also, at that lower timeframe, it's unclear what the charger is actually *doing*. It seems to be constantly sending out various voltages, somewhat resembling a sawtooth but also just resembling noise. After some research, I suspect Anker actually did not use GaN technology at all but used traditional technology with aggressive frequency dithering to help ease the noise. This may not be the case but it is my suspicion. 

      <em>Sidenote: you might point out that earlier I mentioned the AOHI GaN chargers have the ability to change their switching frequency as needed. You may be saying, how is that any different from what you are saying Anker did here? It's a valid question. The difference is that Anker clearly had too much noise at the switching frequency of the charger, which I'm estimating to be 90KHz, and they needed to spread that noise out. So they do employ a variable switching frequency but only vary it by 20-50KHz. Constantly moving the switching frequency up and down, so the noise doesn't make any one peak so high that it fails regulatory testing. On the other hand, AOHI has no noise to begin with, so when they change the switching frequency, it's only happening once (I suspect only when the requested voltage changes). They don't need to constantly switch up and down, because their aim is not to spread noise out. </em>
    rating: 1
    noise_rating: 1
    ripple_rating: 2
    overall_rating: 1
    noise_mv: 244

  - name: "Counterfeit Samsung"
    img1: "/assets/images/Counerfeit Samsung 3.png"
    img2: "/assets/images/Counerfeit Samsung 1.png"
    bg: "hsl(0, 32%, 93%)"
    caption: |
      The worst one of the bunch, but that would be expected with a counterfeit charger, so it's not surprising. The original researcher (Ken Shirriff) doubled his scale to show the graph of his worst charger, but I wanted to evaluate all my chargers on the same scale so you can see how bad some of these really are. Looking at the image, it's tough to figure out what this charger is even trying to do. Is it trying to send any specific voltage, or just throw some power around? Even when I took the net voltage, it still failed other tests. It provided 4.4V when 5V was requested, so it doesn't even pass USB spec.
      
      Another issue I noticed was overcurrent. The other chargers would allow a slight or moderate amount of current past their max rating, but would cleanly shut off before the voltage became too low. As I suspected, this charger let its voltage sag and allowed the current to rise nearly a whole amp above what it claims to support. This 10W charger was pumping out nearly 14W before it finally shut off. Yikes.
    rating: 1
    noise_rating: 1
    ripple_rating: 1
    overall_rating: 1
    noise_mv: 468
---

## A Dozen+ Chargers in the Lab: Apple is Okay, but Not the Best

<!-- INTRO: Write your opening paragraph(s) here. Why did you test this? What inspired you? (e.g. Ken Shirriff) What is the reader going to learn? -->

Have you ever wondered if there are 'good' and 'bad' chargers? Is there really a difference between a $5 brick you get at an airport and a $30 one you order direct from a name brand? As it turns out, cheaply made chargers can operate far differently from name-brand ones, and can sometimes be dangerous to use.

I'd thought about this topic for years ever since I read a [blog post by one Google engineer Ken Shirriff](https://www.righto.com/2012/10/a-dozen-usb-chargers-in-lab-apple-is.html). It was at the top of [Hacker News](https://news.ycombinator.com/) at the time, many years ago. Ken made the case that there is absolutely a difference between the best and worst chargers, and that poorly built chargers have the ability to not only degrade battery life but cause other strange issues like touchscreen glitches.

Most of his work went over my head at the time, but I kept thinking about whether anyone would recreate this for modern USB-C chargers. Fast forward six years, and I still have yet to find anything. There may very well be an article just like this, and if there is I'd love to find it! But since I haven't seen anything like that yet, I decided to figure out exactly what Ken did and try to recreate it. I reached out to a mechanical engineer friend, and we started bouncing ideas back and forth until this project eventually came to life. He helped me complete some of the work below - thank you, Spencer!


Here's the short version of what I found: 
- GaN chargers are among the best you can buy today, and the marketing around them IS real.
- Cheap chargers can also perform well, so the price you pay for a charger doesn't always correlate to its performance.
- Common brands like Apple generally do test favorably, but some smaller brands edge them out. 
- There is an extreme amount of variation even within each brand. Some produce both high-quality and extremely low-quality chargers, and you'd have no way of knowing without testing them.

<br>

<figure>
  <img src="/assets/images/ken_ss.png" alt="Ken Shirriff's original charger teardown">
  <figcaption>Ken Shirriff's original charger teardown article from 2012</figcaption>
</figure>

---

## What I tested

To get as much out of this project as possible, I tested a lot of chargers. Here's the full list:
- Anker ASPD053a USB C 
- Anker 637 Magnetic Charging Station (USB A port and USB C port)
- AOHI GaN 65W AOC-C019 
- AOHI GaN 100W AOC-C018 
- Amazon Kindle 9W PS57CP 
- Dealworthy 20W PYSD-20PCQ-1CU
- SHARGEEK 35W Retro S035U  
- Apple HomePod Mini A2305 (Same as Apple 20W Retail charger)
- Apple 30W Retail A2164
- Eero 15W C110011
- Anker 100W A121B GaN Flagship
- Anker Nano 45W A121D GaN Flagship
- Spigen PowerArc ArcStation Pro 30W GaN PE2013UJ
- Apple 96W Retail A2166
- VEBNER 65W PD65U55
- Govee 10W BI12T-050200-BdUU
- Counterfeit AT&T 10W 'NA010050020'
- Counterfeit Chinese Wall Adapter 10.5W WP2UWR
- Counterfeit Samsung 10W EP-TA20JBE

I also tested a Macbook Pro M1, an iPhone 17 Pro, and an Anker 621 MAG GO 5000mAh Battery for fun. These aren't chargers, so I'll keep them out of the list above, but they are included in the various results below.

For each charger, I tested it on several dimensions: **Advertised power versus actual power, power quality, and overcurrent.**
- **Advertised power versus actual power** tells you how well the charger can maintain its intended voltage while putting out maximum current. 
- **Power quality** means the amount of noise that appears when viewing the charger with an oscilloscope. This noise comes in many forms, but the general idea is that the flatter, the less noise. 
- **Overcurrent** shows how a charger behaves when a device tries to pull too much current. This is achieved by connecting a charger to an electronic load and having that load request more and more current until the device shuts off. It helps show how well-regulated a charger is, and if it is capable of protecting itself during load. 




## Testing Setup


As it turns out, testing USB C cables is a little complex. Modern chargers rely on the USB C Power Delivery (PD) standard, which generally specifies five voltages they can choose from: 5V, 9V, 12V, 15V, 20V. There are modern variants of this that complicate things even more, such as Programmable Power Supply (PPS) and Adjustable Voltage Supply (AVS), but I won't get into those. For this project, I just tested chargers according to the USB C PD spec. USB C PD also specifies that devices should be within +/- 5% of their advertised voltage in order to achieve certification (this is oversimplifying, but the general rule).

With this in mind, my setup consisted of a few different pieces:
1. An oscilloscope, specifically the Rigol DS1054Z
2. An electronic load
3. A USB C Power Delivery decoy board
4. A voltmeter
5. Plenty of electrical wires and extra USB cables

I would plug the charger into the wall, and connect it to a USB C Decoy Board which had an electronic load at the other end. The last part was accomplished using stray wires, however I ensured they were thick enough that their resistance would be low.

I didn't even realize I would need a decoy board at first. Spencer and I just thought we could connect a charger to a load and see what happened. After multiple attempts where the chargers would produce no output, we learned that USB C chargers require negotiation before they will send pwoer. *I do not think Ken needed this piece since his chargers were constant voltage, but mine unfortunately do require it.* 

As for the scope, my Rigol DS1054Z was set up with its probe touching the positive and negative terminals on the decoy board. I used the spring-based ground clip instead of the alligator ground clip that came with the probe so that my noise readings would be lower.
*Tip: If you want to do testing of your own, always use the spring ground clip. I learned well into this project that using the default alligator ground clip will lead to extremely high noise ratings. Avoid my mistake and save yourself the rework of testing every charger again by making sure you do this.*

### A note about resistance

One of the things I learned during this project was that resistance could be artificially skewing my measurements. To account for this, I ensured each test was conducted with my voltmeter directly connected to the charger's output terminal.

If you're interested, the equivalent resistance of my voltmeter during testing was 6.67 mΩ, and the entire system (cable + breakout board + voltmeter) was 170 mΩ. Again, this resistance doesn't apply to any of the numerical measurements I have below, since I connected directly to the charger output. However I am honestly proud how minor this resistance is for a testing setup, considering USB C cables themselves are allowed to carry a resistance of up to 166 mΩ per the USB C PD spec. 


### Rating system for Oscilloscope graphs 
**Noise and Switching Ripple**

After conducting the oscilloscope tests, I rated each charger from 1 to 5, using lightning bolts as a fun visual guide. These ratings consider two separate factors: overall high-frequency noise (Vpp/spikes) and switching ripple. 
- **Noise** includes the more chaotic high-frequency artifacts, large vertical spikes, and overall 'fuzziness' in the output. By measuring the overall peak-to-peak (Vpp) voltage, I can effectively rank the true Noise.
- **Switching Ripple** refers to the high-frequency peaks (e.g., 50KHz, 100KHz) caused by the charger's internal oscillator continually charging and discharging. This differs from Ken's methodology, as he used the word **Ripple** specifically to mean the 120Hz line-frequency fluctuations caused by your household AC power. 

- Mst of my chargers look incredibly dense and 'thick' compared to the ones Ken examined. I believe this is becuase my scope has a memory depth of 24 million points, while the most I saw on Ken's graphs were around ~50,000 equivalent points of memory depth. I believe the inclusion of this raw high-frequency data at every zoom level is the most honest way to display these chargers. 

For noise, the bolt ratings loosely map to measured peak-to-peak voltage noise on the oscilloscope:

- 1 bolt: over ~250mV
- 2 bolts: under ~250mV
- 3 bolts: under ~160mV
- 4 bolts: under ~100mV
- 5 bolts: under ~80mV

These are just general guidelines. I used my judgment for each charger based on everything I could see, including the shape of the waveform and the FFT spectrum, not just the raw mV reading.

<figure style="max-width: 300px;">
  <img src="/assets/images/oscillsocope_pic.jpg" alt="Old setup with oscilloscope" style="width: 100%;">
  <figcaption>My original setup with the oscilloscope (before I started using USB C Decoy boards)</figcaption>
</figure>


---

## The Results

Scroll through the cards and click any one to expand the full oscilloscope graphs. Each card shows the worst graph I could reproduce for that charger, assuming typical power usage. 
- I learned during testing that all devices showed similar noise profiles at different voltages, so I stuck with lower voltages for these screenshots. Most screenshots below were taken when the charger was giving 9V.
- Within each voltage, I cycled through each charger's range of allowable current, and usually selected the worst graph. If the charger showed noise at the extreme low or high end of current, but no issues for the vast majority of measurements, I would take the less severe graph. This is because I want what you're seeing to approximate the noise your device would *actually* experience during  charging, not some hypothetical rating you will never actually see during normal usage.


### A few more details on noise and ripple

They look confusing at first glance, but you don't need to be an electrical engineer to understand these next graphs. Here is a quick primer on what you're looking at:

- **Yellow Line (Voltage Trace):** This represents the actual voltage being delivered to your device. The horizontal axis represents time, and the vertical axis represents voltage. In a perfect world, this would be a single, razor-thin, perfectly flat horizontal line. Any deviation from this is an imperfection.
- **Purple Line (FFT Spectrum):** You'll see this purple mountain range near the bottom of many graphs. This is a Fast Fourier Transform (FFT). It takes all the imperfections from the yellow line and sorts them by frequency. A large spike here would mean there is a significant amount of energy at that specific frequency.
- **Noise vs. Switching Ripple:** You'll see me use these terms often to describe the imperfections on these graphs. My definitions distinguish the two so I can rank them separately.
  - **Switching Ripple** is the presence of a main, high-frequency spike (and its harmonics) on the FFT. This is caused by the natural charging and discharging cycle of the charger's internal circuit. AC Chargers will swtich on and off many times per second to effectively create something that is DC current. For that reason, if I see a significant peak at 90KHz and nowhere else, for instance, I would say the charger has its primary switching ripple at 90KHz. If the charger has peaks at 90KHz and 180KHz, that is the switching ripple and its harmonic at 180KHz. *(Note: Ken used the term ripple to mean **Line Ripple**, to describe the lower 120Hz fluctuations caused by the AC wall input; I use Switching Ripple to focus purely on the oscillator!)*

  - **Noise** includes any imperfections on the voltage graph measured in peak-to-peak voltage (Vpp). There are many different kinds of noise, including high-frequency vertical spikes, fuzzy blur, and general jitter. Switching ripple is one component of this.

  - **'Fuzzy' Blur**: If the yellow line looks incredibly thick or "fuzzy," it means the charger is constantly shifting its switching speed back and forth (frequency dithering) to dynamically smear its noise.

- **Good vs. Bad:** A high-quality charger produces a thin, flat yellow line with minimal action on the purple FFT graph (ideally just one sharp needle representing its switching ripple). A poor-quality charger will have a thick, fuzzy yellow line (lots of jitter/noise), obvious rolling waves (line ripple), and many aggressive, evenly spaced harmonic spikes on the purple FFT graph (severe switching ripple).


## Oscilloscope Graphs

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
  .stats-table td:nth-child(1),
  .stats-table td:nth-child(2) {
    background-color: rgba(0, 0, 0, 0.03);
  }
  @media (prefers-color-scheme: dark) {
    .stats-table th, .stats-table td {
      border-color: #2a2a2a;
    }
    .stats-table th {
      background-color: #181818;
    }
    .stats-table td:nth-child(1),
    .stats-table td:nth-child(2) {
      background-color: rgba(255, 255, 255, 0.04);
    }
    .usba-badge {
      color: #888;
      border-color: #444;
    }
  }
  html[data-theme="dark"] .stats-table th, html[data-theme="dark"] .stats-table td { border-color: #2a2a2a; }
  html[data-theme="dark"] .stats-table th { background-color: #181818; }
  html[data-theme="dark"] .stats-table td:nth-child(1),
  html[data-theme="dark"] .stats-table td:nth-child(2) { background-color: rgba(255, 255, 255, 0.04); }
  html[data-theme="dark"] .usba-badge { color: #888; border-color: #444; }
  html[data-theme="light"] .stats-table th, html[data-theme="light"] .stats-table td { border-color: #dddddd; }
  html[data-theme="light"] .stats-table th { background-color: #f2f2f2; }
  html[data-theme="light"] .stats-table td:nth-child(1),
  html[data-theme="light"] .stats-table td:nth-child(2) { background-color: rgba(0, 0, 0, 0.03); }
  html[data-theme="light"] .usba-badge { color: #555; border-color: #aaa; }
  tr.battery-row { opacity: 0.38; }
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


<br>

### Oscilloscope Graphs - Results Table
<span style="color: #888; font-style: italic;">(The DC items in here, like the Macbook Pro, are colored in grey to avoid conflating them with the AC chargers. They're just included here for reference.)</span>

<div class="table-wrapper">
<table>
  <thead>
    <tr>
      <th>Charger</th>
      <th>Noise in mV</th>
      <th>Noise Rating (Vpp and Spikes)</th>
      <th>Switching Ripple Rating (FFT Harmonics)</th>
    </tr>
  </thead>
  <tbody>
    {% assign sorted_devices = page.devices | sort: "noise_mv" %}
    {% for item in sorted_devices %}
      {% assign is_battery = false %}
      {% assign lowercase_name = item.name | downcase %}
      {% if lowercase_name contains "battery" or lowercase_name contains "macbook pro m1" or lowercase_name contains "iphone" %}
        {% assign is_battery = true %}
      {% endif %}

      {% assign badge = "" %}
      {% assign display_name = item.name %}
      {% if item.name contains "(USB A Only)" %}
        {% assign display_name = item.name | remove: " (USB A Only)" %}
        {% assign badge = '<span class="usba-badge">USB A Only</span>' %}
      {% elsif item.name contains " - USB C Port" %}
        {% assign display_name = item.name | remove: " Port" %}
      {% endif %}

      <tr{% if is_battery %} class="battery-row"{% endif %}>
        <td><strong>{{ display_name }}</strong>{{ badge }}</td>
        <td>{{ item.noise_mv }}mV</td>
        <td>
          <span class="bolt-{{ item.noise_rating }}">
            {% for i in (1..item.noise_rating) %}&#x26A1;&#xFE0E;{% endfor %}
          </span>
        </td>
        <td>
          {% if item.ripple_rating == "N/A" %}
            N/A
          {% else %}
            <span class="bolt-{{ item.ripple_rating }}">
              {% for i in (1..item.ripple_rating) %}&#x26A1;&#xFE0E;{% endfor %}
            </span>
          {% endif %}
        </td>
      </tr>
    {% endfor %}
  </tbody>
</table>
</div>



## Expected/Actual Output
Before we get into this table, I want to make one caveat: my setup was not robust enough to handle testing at the full 65W or 100W that certain chargers are rated for. That is why I tested each charger at *one* of its max current/ voltage configurations. Say Charger A Is called a "65W" charger on the box. Charger A supports:
- 20V, up to 3.25 A (to reach max power of 65W)
And it *also* supports:
- 5V, up to 3 A
- 9V, up to 3 A
- 12V, up to 3 A
- 15V, up to 3 A

In this case, I'd do base level testing to see if I can get the charger to output its max power for a second or two. Then, for the oscilloscope traces, I would drop the device down to something like 9V and cycle through all its current levels. This is so that I could avoid overheating my breakout board. As stated earlier, *all* chargers showed similar noise profiles at their different voltages, so I am confident that the results you see below are reproducible, even if your device uses one voltage setting under or above what I did.


The Actual Voltage column is highlighted <span style="color:#228B22; font-weight:700;">green</span> if the measured voltage is within ±5% of the nominal output voltage (the USB-C PD spec limit) and <span style="color:#C41C00; font-weight:700;">red</span> if it falls outside that window in either direction. For example, a 5V output must stay between 4.75V and 5.25V.

<span style="color: #888; font-style: italic;">(The DC items in here, like the Macbook Pro, are colored in grey to avoid conflating them with the AC chargers. They're just included here for reference.)</span>
### Expected/Actual Output Table
<div class="table-wrapper">
<table class="stats-table">
  <thead>
    <tr>
      <th>Charger</th>
      <th>Attempted To Pull (W)</th>
      <th>Actual Voltage (V)</th>
      <th>Actual Current (A)</th>
      <th>Actual Power (W)</th>
      <th>Passes Spec?</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><strong>Eero 15W Charger</strong></td><td>15 (5v, 3a)</td><td class="diff-pos">4.76</td><td>2.91</td><td>13.85</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Shargeek Macintosh Charger</strong></td><td>27 (9v, 3a)</td><td class="diff-pos">8.9</td><td>3.0</td><td>27.0</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Apple 30W Retail Charger</strong></td><td>30 (20v, 1.5a)</td><td class="diff-pos">20.04</td><td>1.42</td><td>28.45</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Apple HomePod Mini Charger</strong></td><td>19.98 (9v 2.22a)</td><td class="diff-pos">8.90</td><td>2.23</td><td>19.85</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Vebner GaN 65W Charger</strong></td><td>27 (9v, 3a)</td><td class="diff-pos">8.64</td><td>3.04</td><td>26.26</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Govee Power Supply</strong><span class="usba-badge">USB A Only</span></td><td>10 (5v, 2a)</td><td class="diff-pos">5.04</td><td>2.02</td><td>10.18</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Counterfeit AT&amp;T</strong><span class="usba-badge">USB A Only</span></td><td>10 (5v, 2a)</td><td class="diff-neg">5.38</td><td>2.01</td><td>10.81</td><td class="diff-neg">&#x2717;</td></tr>
    <tr><td><strong>Counterfeit Samsung</strong></td><td>10 (5v, 2a)</td><td class="diff-neg">4.4</td><td>2.0</td><td>8.9</td><td class="diff-neg">&#x2717;</td></tr>
    <tr><td><strong>Amazon Kindle Charger</strong></td><td>9.36 (5.2v, 1.8a)</td><td class="diff-neg">5.30</td><td>1.81</td><td>9.59</td><td class="diff-neg">&#x2717;</td></tr>
    <tr><td><strong>Counterfeit Chinese Wall Charger</strong><span class="usba-badge">USB A Only</span></td><td>10.5 (5v, 2.1a)</td><td class="diff-neg">4.5</td><td>2.13</td><td>9.6</td><td class="diff-neg">&#x2717;</td></tr>
    <tr><td><strong>Dealworthy Charger</strong></td><td>20 (12v, 1.67a)</td><td class="diff-pos">11.97</td><td>1.57</td><td>18.79</td><td class="diff-pos">&#x2713;</td></tr>
    <tr class="battery-row"><td><strong>Anker 621 MAG GO 5000mAh Battery</strong></td><td>12</td><td class="diff-neg">4.74</td><td>2.43</td><td>11.54</td><td class="diff-neg">&#x2717;</td></tr>
    <tr class="battery-row"><td><strong>iPhone 17 pro</strong></td><td>4.5</td><td class="diff-pos">4.81</td><td>1.12</td><td>5.39</td><td class="diff-pos">&#x2713;</td></tr>
    <tr class="battery-row"><td><strong>Macbook Pro M1</strong></td><td>15 (5v, 3a)</td><td class="diff-pos">5.05</td><td>3.03</td><td>15.30</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Anker ASPD053a</strong></td><td>27 (9v, 3a)</td><td class="diff-pos">8.88</td><td>3.02</td><td>26.82</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Apple 96W Macbook Charger</strong></td><td>45 (15v, 3a)</td><td class="diff-pos">15.08</td><td>3.02</td><td>45.54</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>AOHI 100W GaN Charger</strong></td><td>36 (12v, 3a)</td><td class="diff-pos">11.82</td><td>3.02</td><td>35.52</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Anker 637 Magnetic Charging Station 1 - USB A port</strong><span class="usba-badge">USB A</span></td><td>12 (5v, 2.4a)</td><td class="diff-pos">5.13</td><td>2.42</td><td>12.41</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Anker 637 Magnetic Charging Station 2 - USB C port</strong></td><td>36 (12v, 3a)</td><td class="diff-pos">11.79</td><td>3.02</td><td>35.65</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Spigen PowerArc ArcStation Pro</strong></td><td>27 (9v, 3a)</td><td class="diff-pos">8.91</td><td>3.02</td><td>26.91</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Anker A121D 45W iPhone 17 Charger</strong></td><td>45 (15v, 3a)</td><td class="diff-pos">14.82</td><td>3.03</td><td>44.90</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>Anker A121B 100W Charger</strong></td><td>45 (15v, 3a)</td><td class="diff-pos">14.99</td><td>3.02</td><td>45.26</td><td class="diff-pos">&#x2713;</td></tr>
    <tr><td><strong>AOHI GaN 65W Charger</strong></td><td>36 (12v, 3a)</td><td class="diff-pos">12.13</td><td>3.02</td><td>36.63</td><td class="diff-pos">&#x2713;</td></tr>
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
  html[data-theme="dark"] th, html[data-theme="dark"] td { border-color: #2a2a2a; }
  html[data-theme="dark"] th { background-color: #181818; }
  html[data-theme="dark"] table .bolt-5 { color: #42d773; -webkit-text-stroke: 1px #42d773; }
  html[data-theme="dark"] table .bolt-4 { color: #8cd742; -webkit-text-stroke: 1px #8cd742; }
  html[data-theme="dark"] table .bolt-3 { color: #eebd2b; -webkit-text-stroke: 1px #eebd2b; }
  html[data-theme="dark"] table .bolt-2 { color: #f08b42; -webkit-text-stroke: 1px #f08b42; }
  html[data-theme="dark"] table .bolt-1 { color: #e96363; -webkit-text-stroke: 1px #e96363; }
  html[data-theme="light"] th, html[data-theme="light"] td { border-color: #dddddd; }
  html[data-theme="light"] th { background-color: #f2f2f2; }
  html[data-theme="light"] table .bolt-5 { color: #15933f; -webkit-text-stroke: 1px #15933f; }
  html[data-theme="light"] table .bolt-4 { color: #7ad025; -webkit-text-stroke: 1px #7ad025; }
  html[data-theme="light"] table .bolt-3 { color: #f2c336; -webkit-text-stroke: 1px #f2c336; }
  html[data-theme="light"] table .bolt-2 { color: #f08b42; -webkit-text-stroke: 1px #f08b42; }
  html[data-theme="light"] table .bolt-1 { color: #e02929; -webkit-text-stroke: 1px #e02929; }
</style>

<br>


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
  html[data-theme="dark"] .card-title-above { color: rgba(255, 255, 255, 0.25); }
  html[data-theme="light"] .card-title-above { color: rgba(0, 0, 0, 0.65); }
  .device-card {
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
    overflow: hidden;
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
    overflow: hidden;
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
  /* These badges sit on pastel card backgrounds so colors are the same in both themes */
  html[data-theme="dark"] .rating-badge-5 { background: rgba(46, 204, 113, 0.22); border-color: rgba(46, 204, 113, 0.55); color: #145a30; }
  html[data-theme="dark"] .rating-badge-4 { background: rgba(74, 222, 128, 0.22); border-color: rgba(74, 222, 128, 0.55); color: #166534; }
  html[data-theme="dark"] .rating-badge-3 { background: rgba(134, 239, 172, 0.22); border-color: rgba(134, 239, 172, 0.55); color: #14532d; }
  html[data-theme="dark"] .rating-badge-2 { background: rgba(250, 204, 21, 0.22); border-color: rgba(250, 204, 21, 0.55); color: #854d0e; }
  html[data-theme="dark"] .rating-badge-1 { background: rgba(248, 113, 113, 0.22); border-color: rgba(248, 113, 113, 0.55); color: #991b1b; }
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


## Overcurrent Testing

The last piece of Ken Shirriff's testing I wanted to replicate was overcurrent. Naturally, since devices get to decide how much current they want to pull, it's up to the charger to make sure the device doesn't pull too much current. Like I mentioned earlier, chargers generally have two strategies to deal with this: 
1) shut off completely, or 
2) reduce the output voltage. 
Option 1 is preferred in most cases. Option 2 is really just a consequence of not doing option 1. There is a third scenario, where the charger can somehow increase the current at the same voltage, but this would mean operating the device outside of its standard conditions, and would likely lead to it overheating.

During my overcurrent testing, I set the electronic load to keep pulling more and more current until the charger shut off. While Ken was able to display the relationship between voltage and overcurrent on beautiful time-based graphs, I lack that recording capability so my results are very simple. When I did conduct the overcurrent test on the oscilloscope, all my voltage graphs were relatively tight during overcurrent testing. I only had one charger (Counterfeit Samsung) that completely blew the test. The others did a great job of keeping their voltage within a reasonable range, even during overcurrent. For that reason, I would say the values below are the true values of the voltage and current of the device at their shutoff period. 

<figure style="max-width: 600px; text-align: center;">
  <img src="/assets/images/load_example.png" alt="Ken current" style="width: 100%;">
  <figcaption>A good example of Ken's overcurrent graphs. I wasn't able to recreate his setup like this.</figcaption>
</figure>
<figure style="max-width: 600px; text-align: center;">
  <img src="/assets/images/ken_bad.png" alt="Ken current 2" style="width: 100%;">
  <figcaption>An example of a bad charger Ken tested. While I wasn't able to capture graphs like this and save them, what I can say is that my graphs all looked like the earlier one, not this one (with the exception of counterfeit samsung)</figcaption>
</figure>


The ideal value here is having a voltage equal to 5V or 9V. You don't want 3 or 4 volts, or 7 or 8 volts, because that suggests the charger allowed more current out than it should have.

*I don't have overcurrent results for all chargers in the table below. This will be updated as more test results become available.*

### Overcurrent Results Table
<style>
  .overcurrent-table {
    border-collapse: collapse;
    width: 100%;
    min-width: 600px;
    font-family: sans-serif;
    font-size: calc(1em - 1px);
  }
  .overcurrent-table th, .overcurrent-table td {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 6px 10px;
  }
  .overcurrent-table th {
    background-color: #f2f2f2;
  }
  .overcurrent-table td:nth-child(1) {
    background-color: rgba(0, 0, 0, 0.03);
  }
  .overcurrent-table td.oc-pos { color: #228B22; font-weight: 700; }
  .overcurrent-table td.oc-neg { color: #C41C00; font-weight: 700; }
  @media (prefers-color-scheme: dark) {
    .overcurrent-table th, .overcurrent-table td {
      border-color: #2a2a2a;
    }
    .overcurrent-table th {
      background-color: #181818;
    }
    .overcurrent-table td:nth-child(1) {
      background-color: rgba(255, 255, 255, 0.04);
    }
  }
  html[data-theme="dark"] .overcurrent-table th, html[data-theme="dark"] .overcurrent-table td { border-color: #2a2a2a; }
  html[data-theme="dark"] .overcurrent-table th { background-color: #181818; }
  html[data-theme="dark"] .overcurrent-table td:nth-child(1) { background-color: rgba(255, 255, 255, 0.04); }
  html[data-theme="light"] .overcurrent-table th, html[data-theme="light"] .overcurrent-table td { border-color: #dddddd; }
  html[data-theme="light"] .overcurrent-table th { background-color: #f2f2f2; }
  html[data-theme="light"] .overcurrent-table td:nth-child(1) { background-color: rgba(0, 0, 0, 0.03); }
</style>

<div class="table-wrapper">
<table class="overcurrent-table">
  <thead>
    <tr>
      <th>Adapter</th>
      <th>Difference between advertised Current and Current at shutoff</th>
      <th>Difference between advertised Voltage and Voltage at shutoff</th>
      <th>Difference between advertised Power and Power at Shutoff (W)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><strong>Vebner GaN</strong></td><td class="oc-pos">0.42</td><td class="oc-pos">0.13</td><td class="oc-pos">2.5</td></tr>
    <tr><td><strong>AOHI GaN 100W</strong></td><td class="oc-pos">0.6</td><td class="oc-pos">0.13</td><td class="oc-pos">3.5</td></tr>
    <tr><td><strong>Anker A121B 100W GaN Charger</strong></td><td class="oc-pos">0.35</td><td class="oc-pos">0.12</td><td class="oc-pos">2.2</td></tr>
    <tr><td><strong>Anker A121D 45W iPhone 17 Charger</strong></td><td class="oc-pos">0.44</td><td class="oc-neg">-0.09</td><td class="oc-pos">1.9</td></tr>
    <tr><td><strong>Anker 637 Magnetic Charging Station 2 - USB C port</strong></td><td class="oc-pos">0.7</td><td class="oc-neg">-0.22</td><td class="oc-pos">7.6</td></tr>
    <tr><td><strong>Apple HomePod Mini (20W)</strong></td><td class="oc-pos">0.42</td><td class="oc-neg">-0.11</td><td class="oc-pos">1.7</td></tr>
    <tr><td><strong>Apple 30W Retail</strong></td><td class="oc-pos">0.17</td><td class="oc-neg">-0.14</td><td class="oc-pos">0.4</td></tr>
    <tr><td><strong>Apple 96W</strong></td><td class="oc-pos">0.46</td><td class="oc-neg">-0.37</td><td class="oc-pos">1.1</td></tr>
    <tr><td><strong>Amazon Kindle</strong></td><td class="oc-pos">0.1</td><td class="oc-neg">-0.4</td><td class="oc-neg">-0.2</td></tr>
    <tr><td><strong>Spigen PowerArc ArcStation</strong></td><td class="oc-pos">0.22</td><td class="oc-neg">-0.27</td><td class="oc-pos">0.2</td></tr>
    <tr><td><strong>AOHI GaN 65W Charger</strong></td><td class="oc-pos">0.33</td><td class="oc-neg">-0.3</td><td class="oc-pos">0.7</td></tr>
    <tr><td><strong>Eero 15W Charger</strong></td><td class="oc-pos">0.36</td><td class="oc-neg">-0.31</td><td class="oc-pos">0.8</td></tr>
    <tr><td><strong>Counterfeit Chinese Wall Charger</strong></td><td class="oc-pos">0.23</td><td class="oc-neg">-0.57</td><td class="oc-neg">-0.2</td></tr>
    <tr><td><strong>Counterfeit Samsung</strong></td><td class="oc-pos">0.81</td><td class="oc-neg">-1.2</td><td class="oc-pos">0.64</td></tr>
  </tbody>
</table>
</div>


A mixed bag of results from overcurrent. The Kindle is the most disappointing one in my opinion, because it shut off so quickly at just 0.1 A above its rated current, and somehow its voltage still dropped. However, the worst offenders are from the Apple 96W, Spigen PowerArc, Eero, and the counterfeit Chinese wall charger. All had voltage drops that suggest they go below what would be considered USB standards. There may have been an issue in testing or these chargers might not be as well-regulated.


A new update: I re-ran the tests one more time with a brand new multimeter to show the results in this table. Upon reviewing, the **Spigen, Apple 96W, Counterfeit Chinese wall charger, AOHI GaN 65W, and Amazon Kindle, and Eero** are all starting to break past the +/- 5% voltage threshold for USB certification. I re-rested them under the oscilloscope, and found some interesting results: while most of these chargers offered relatively focused voltage traces, usually ranging by about 0.1V, the counterfeit Samsung was the one outlier. This charger had such a noisy voltage trace that, near shutoff, it oscillated between 3.7 V, 0, and 8.5 V. This dangerous behavior was truly unique and not present in *any* of the other chargers I tested. When your phone or laptop attempts to pull too much current, this charger will start sending massive shockwaves of voltage. 





<br>
<br>
---
<br>


## Conclusion

Wow, that was a lot. Evaluating chargers seemed quite difficult at first, but this whole project quickly turned into something that genuinely excited me. What I liked most about this is that you don't need to be an electrical engineer to see the difference between good and bad chargers. The oscilloscope really does make it obvious. Things get confusing when you go past the 'what' and try to start understanding ths *why*. *Why* certain peaks appear in the FFT, *why* some scope traces look as bad as they do, or *why* a charger measured fine at 1A but looked terrible at 2.5A. I still don't have great answers to these, but hope to learn more with time.

The practical takeaway, in my opinion, is that most name-brand chargers of today are unlikely to damage your phone battery. Since modern devices filter noise internally, and the majority of these chagers stayed within that USB spec of ±5% voltage tolerance, they're unlikely to be a problem. Just avoid excessively cheap, no-name chargers and you should be fine. And that Anker flagship.. maybe avoid that one too.

I hope you enjoyed reading. This really was a pleasure to put together. Car chargers are next on my list, and I suspect that may be a story of its own. If you have any suggestions to make, corrections to add, or just want to share something you found interesting, feel free to reach out and let me know. Contact is on the About page.



### -Sean
<br>
Last thing: a huge shout out to both Ken and my good friend Spencer! I could not have done this without either of them.
<figure style="max-width: 600px; text-align: center;">
  <a href= "/assets/images/spencerandsean1.jpg"><img src="/assets/images/spencerandsean1.jpg" alt="Spencer and Sean" style="width: 100%;"></a>
  <figcaption>Me and Spencer. Best friends make good electrical testing partners!</figcaption>
</figure>
