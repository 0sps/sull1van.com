---
layout: post
title: "PROJECT: 7,500 Miles in a Self-Driving Car"
date: 2026-05-15
tags: [personal, tech]
---
<div id="splash-background"></div>
<div id="kia2-background"></div>
<div id="kia3-background"></div>
<div id="kia4-background"></div>

<style>

  #splash-background {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100vw;
    height: 100vh;
    background-image: url('/assets/images/splash.jpeg');
    background-size: auto 122%;
    background-position: center top;
    background-repeat: no-repeat;
    z-index: -3;
    -webkit-mask-image: linear-gradient(to top, black 0%, transparent 70%);
    mask-image: linear-gradient(to top, black 0%, transparent 70%);
  }

  #kia2-background {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 115vh;
    height: 100vw;
    transform: translate(-50%, -50%) rotate(90deg);
    background-image: url('/assets/images/kia2.jpg');
    background-size: cover;
    background-position: center center;
    z-index: -3;
    opacity: 0.5;
    -webkit-mask-image: linear-gradient(to top, black 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.1) 100%), linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
    -webkit-mask-composite: source-in;
    mask-image: linear-gradient(to top, black 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.1) 100%), linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
    mask-composite: intersect;
  }

  #kia3-background {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100vw;
    height: 100vh;
    background-image: url('/assets/images/kia3.JPG');
    background-size: cover;
    background-position: center top;
    z-index: -3;
    -webkit-mask-image: linear-gradient(to bottom, black 0%, black 60vh, transparent 80vh);
    mask-image: linear-gradient(to bottom, black 0%, black 60vh, transparent 80vh);
  }

  #kia4-background {
    position: absolute;
    top: 75%;
    left: 50%;
    width: 115vh;
    height: 100vw;
    transform: translate(-50%, -50%) rotate(-90deg);
    background-image: url('/assets/images/kia5.jpeg');
    background-size: cover;
    background-position: center center;
    z-index: -3;
    opacity: 0.5;
    -webkit-mask-image: linear-gradient(to top, black 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.1) 100%), linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
    -webkit-mask-composite: source-in;
    mask-image: linear-gradient(to top, black 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.1) 100%), linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
    mask-composite: intersect;
  }


  /* Keep the page canvas themed without washing over the background images. */
  html,
  html[data-theme="light"] {
    background: #fff;
  }
  body {
    position: relative;
    padding-bottom: 70vh;
    background: transparent !important;
  }
  footer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: max(12vh, 5rem);
    z-index: 1;
    background: transparent;
    color: #eee;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.9), 0 1px 2px rgba(0, 0, 0, 0.95);
  }
  footer hr {
    display: none;
  }
  footer a:link,
  footer a:visited,
  footer a:focus,
  footer a:hover,
  footer a:active {
    color: #eef;
  }
  html[data-theme="dark"] {
    background: #111;
  }
  @media (prefers-color-scheme: dark) {
    html {
      background: #111;
    }
    html[data-theme="light"] {
      background: #fff;
    }
  }

  /* Title styling */
  h1 {
    margin-top: 0;
    padding-top: 70vh;
    font-size: 2.3em;
  }
</style>


## One month on the road with a self-driving car

In summer 2025, I had a pretty big goal. I wanted to drive across the entire western half of the country on a solo road trip, within the span of one month.

It took weeks to plan out the complete itinerary, which involved stops in over 23 states, and visiting with twelve different friends all across the country, plus working out of three different Chase offices.

The coolest part of the trip, though, was how I drove around, thanks to the Comma 3X. 

By the end of the month, the car had handled a huge amount of the highway driving, but only after I spent a lot of time learning exactly when to trust it and when to take over.

Comma.ai is a startup trying to make autonomous driving accessible to everyone. They sell small, windshield-mounted computers that take control of the steering in most production cars. The car must have some kind of lane keep assist, and also needs to be running supported software. 

At first, I saw that my Kia wasn't supported, so I gave up my hopes of autonomous driving as soon as I got the car in 2024. A year later, I learned that there were actually a few modifications I needed to make but that it was very doable.

Comma's software is open source, which means the official version is only part of the story. There are community forks for different cars, different preferences, and edge cases Comma does not officially support. To that end, a group known as Sunnypilot cloned Comma's software and made their own fork of it. Within that fork, there is a group of Hyundai/Kia/Genesis (HKG) owners who made a branch of Sunnypilot that works with newer cars. That is what I used: a fork of a fork :)

So if you end up googling Comma openpilot and see your car isn't supported, I highly recommend doing some more research. In my case, my car wasn't supported, but all I had to do was join the Discord, learn what kind of harness I'd need, buy that one, and figure out who in the community had already forked the code.


<img src="https://blog.comma.ai/img/comma3X/cover.png" alt="Comma 3X" style="max-width: 100%; height: auto;" />

## Installing it

This is where it gets fun. You'll need to look up the Comma setup video specific to your car. I found that all HKG cars now have similar rearview mirrors and camera assemblies. After one thirty-second video, I was able to pull my assembly off and get the Comma installed.

The interesting thing about the Comma 3X is that it sits between your car and the camera. It intercepts the feed coming straight from the camera, decodes it, and uses it for autonomous control. It also has a genius passthrough mechanism where it will pass the camera footage straight through to the car if the Comma loses power. When driving, this would save me in the rare instances in which the Comma was annoying me and I pulled its power plug. Once you do that, the car defaults to its own controls without any issue. It's a highly resilient setup.

## Setting it up

### First launch
By far the hardest thing to work on with a Comma is the software. It will install openpilot by default, which will fuck you over if you are like me and don't have a supported car. Don't do this! You will spend *so much time* trying to force a factory reset only to reinstall openpilot by accident.

On setup, you need to choose "Custom software", and enter in a link. What link exactly? This is where it gets weird.

After a ton of research, I learned you can point the Comma at a website with a release image of the software you want. It's nearly impossible to figure it out, though. I literally could not find the link for sunnypilot. But then I learned that Comma will actually do it for you, as they host Sunnypilot on their own domain. You just type in "sunnypilot" in the custom software URL box, and that's it. For me, I'm using a **branch** of the sunnypilot GitHub repo, so I do "sunnypilot/ccnc-port".


### Getting the specifics right

There are a million and one variables to configure once it launches. The Comma will try to identify your car's fingerprint, refusing to engage if there's an error. Fingerprinting is essentially the Comma identifying what car you own, and what APIs it's going to need to interact with to control your steering. By default, it should be able to fingerprint your car. If it can't, you're screwed. It will let you choose a car manually from the list, but the fact that it couldn't figure it out automatically means it can't communicate with your car properly, so you're probably running the wrong software. This happened to me *a lot* when I would try different branches of Sunnypilot. The only supported one for me is ccnc-port. So if you do this, make sure you are using the appropriate branch for your car.

After fingerprinting, you should go into the settings menu and configure things to your liking. It can show you the speed limit, your current speed, and many other cool metrics. I turn most of these on. One thing Comma does that I've never seen anywhere else is it will actually show you the speed of the car in front of you. I don't know why car manufacturers don't do this to begin with, because the cars know this information thanks to their ultrasound sensors. Either way, it's great to have this on the Comma.

There are also a lot of configuration settings that will affect your driving. It comes with dozens of driving models, each one being about ~70MB a piece and containing a slightly modified version of a driving model based on who trained the data. Comma releases these regularly, as they have their own in-house datacenter that generates the models from driving data. No model is ever the 'best' one, since all cars are different. You really have to just start driving with them to figure out which works well for you. For me, that meant choosing like ~10 models and just spending the entire day on the road testing them. 

You'll also want to look at additional things, like how you want lane changes and braking to work. The Comma won't brake by default, and it won't do lane changes by default, but can if you want it to. I personally do automated lane change, but no braking, since the Comma is pretty shit at managing my speed. 

### Driver monitoring

By far the most 'controversial' aspect of the Comma is that it enables hands-free driving in most cars it's installed in. To do this, the creators have developed a driver monitoring system. The Comma 3X has a wide-angle camera which is constantly watching the driver and running a neural network to assess their attention. For example, if the driver uses a phone during driving, Comma will notice that and start beeping.

Since the software is completely open source, you might think you could change these settings. Turns out, **you absolutely can**. For anyone wondering, it's two files; one called helpers.py, one called monitoring.py. I have done extensive amounts of testing with mine, and have arrived at a happy medium for monitoring: I do WANT the monitoring, since hands-free driving could lead to instances where I become inattentive to what's on the road, but it shouldn't be annoying. I wanted the system to notice real inattention without yelling at me every time I glanced at navigation or checked something quickly at a stop.

This is the sweet spot for me, and it actually improves my driving focus over what came stock on the Kia. If Comma notices me being excessively drowsy while driving, it will make the same extremely loud beep, presumably to wake me up. This *did happen* often when I would drive late at night, and I am very thankful for it. The monitoring you get with the Comma is honestly great peace of mind. You can also be assured that your face isn't being recorded and uploaded anywhere, because you control the software, end to end. It's great.


### Beyond the basics: Asking for help

If you do try to get set up with this, there can be tons of issues. Driverless car technology is insanely complicated, and was extremely difficult to get set up even for someone like me. The great thing about buying a Comma 3X, though, is that you're joining a huge community of car drivers just like you. Sunnypilot and Openpilot both have large Discord chats you can join, and a lot of the useful information is scattered across threads, branch names, harness recommendations, and people casually mentioning the one setting that makes everything work.

## Testing it around town

## Taking it west






# CONSTRUCTION ZONE BELOW



```text
          _                                                       
        ./ |                                                      
       /  /                                                       
     /'  /                                                        
    /   /                                                         
   /    \                                                         
  |      `\                                                       
  |        |                                ___________________   
  |        |___________________...-------'''- - -  =- - =  - = `. 
 /|        |                   -  =  = -  -= - =  - =-   =  - =| 
 |        |                    |= -= - = - = - = - =--= = - = =| 
 \|        |___________________/- = - -= =_- =_-=_- -=_=-=_=_= -| 
  |        |                   ```-------...___________________.' 
  |________|                                                      
    \    /                                                        
    |    |                                                        
  ,-'    `-,                                                      
  |        |                                                      
  `--------'                                                      
```

                                                  


Below is an AI generated suggestion of what to put in this article. the entire thing IS written by me, but this is a list of suggestions for ways I could format the article. keeping it here til i am done.

Cover:
- unboxing
- mounting it
- routing the cable
- connecting to the car harness
- first boot
- anything that felt sketchy, surprisingly easy, or annoying


### Getting it to work


Cover:
- the software setup
- forks, settings, toggles, car compatibility, calibration
- any coding/configuration you had to do
- what was confusing
- what finally made it click


### Testing it around town

Cover:
- first drives in your city
- places where it worked
- places where it absolutely did not
- weird behavior at intersections, curves, lane markings, construction, parked cars, etc.
- the emotional progression from “absolutely not” to “okay, I see it”

### Learning when not to trust it



Examples:
- overconfidence in certain lane markings
- hesitation
- weird disengagements
- driver monitoring nags
- sun glare, rain, construction, bad roads
- things humans find obvious that the car does not


- when you stopped hovering over every tiny input
- when you realized it was reducing fatigue
- when it became a driving partner rather than a gadget

### Taking it west

- 7,500 miles
- highways, deserts, mountains, long empty roads
- how often it drove
- what it was good at
- what still required you
- fatigue difference

### What it changed about driving

- not “self-driving is here”
- more like “this changed what long-distance driving felt like”
- it made driving less tiring, but not effortless
- it made you more aware of what driving actually involves
- it made the future feel both closer and messier

### The conclusion

I drove across the country with a very good assistant that could handle driving better than I expected. It handled most of the driving for the majority of the trip, with me only needing to interject to handle some unexpected situations, and ultimately made the trip significantly more enjoyable.




### List of screenshots i need:
- Image of the comma 3x installed on my dashboard
- close-up of the glass display since i dropped the comma 3x and cracked it
- image of the comma 3x wiring harness that i needed
- screenshot of the comma openpilot repo as well as the sunnypilot github repo
hmmm... what else would be good pictures for this article?
- an image of the car on the road
- screenshot of the comma app interface
- photos of the dashboard with the comma installed
- the car parked in the desert at night
- the car parked with the mountains in the background
- a screenshot of the car on the highway
- 
