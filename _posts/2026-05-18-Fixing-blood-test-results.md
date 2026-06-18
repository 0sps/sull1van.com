---
layout: post
title: "[PROJECT] Fixing my poor blood test results so I can live forever"
date: 2026-05-18
tags: [personal, tech]
published: true
---


Nearly one year ago, I made the decision to start focusing on my bloodwork. I had just received a bad blood test result, and I realized that a bigger effort was needed if I was going to take charge of my health.

I started by looking at the data. Literally, looking *at* it. I had some two-dozen PDFs of all my blood test results dating back to 2018 in a folder on my computer. Every time i get a blood test result, I save the pdf into one folder. I'd been doing that now for about eight years, and while the data store grew larger every month, I didn't really do anything with them.

<div style="text-align: center; margin: 2rem auto;">
    <img src="/assets/images/bloodTest.png" alt="List of PDFs" style="max-width: 1000px; max-height: 450px;" />
</div>

Now, with the advent of Claude Cowork and Codex, I could make use of them. 

## My Plan

My plan was pretty simple, just:
1. Command claude or Codex to delegate an army of subagents to processing my PDFs.
2. File by file, read them with Vision (not some python pdf reader) and take note of all blood test values by hand.
3. Create a master datasheet with all these results
4. Run a separate set of agents to check the first agents' work, and report any inaccuracies they find.
5. Create a central dashboard to read and manage all my blood test results, so I no longer needed to rely on PDFs anymore. Create a new source of truth for my data.

Simple, right?

## How it went

### Steps 1-4: Data conversion
The process was honestly easier than I expected. The agents did a great job converting the blood test results to an excel sheet, and the verification bots didn't find any errors, they just found instances in which the wrong units were used. For example, an ALT test from 2018 used ng/dL, while the ALT from 2020 used ug/L. 


<div style="text-align: center; margin: 2rem auto;">
    <img src="/assets/images/bloodTestExcel.png" alt="List of PDFs" style="max-width: 1000px; max-height: 450px;" />
</div>


### Step 5: The Dashboard

This was the part where I had some fun. I started by asking Claude and Codex to both design some rudimentary visual for the labs. My thought process was pretty straightforward: let's make a dual layout, card-based and list-based. User selects between these two views, and it's either one card or one list item per blood test. They will always show the *most recent* result, followed by the relevant unit. They will be color coded green or red, based on whether they fall outside the normal range for that test.

But what constitutes a 'normal range'? **Depends who you ask!**
  My blood test results frequently showed different refernce ranges for the same blood test across the years. I attribute this mainly to the slight differences between how the two behemoths in the space, LabCorp and Quest Diagnostics, calculate their normal range. I did not find significant variability from within the same company, however. 

  Either way, I ended up making a system for that: each blood test record in my backend database, and in my spreadsheet, *includes* the reference range that the lab gave me for that test at the time of taking. Then, the web UI parses it and shows the *most recent* normal range given. Sometimes they don't give a normal range for a test, so the website will keep crawling older and older records, until it finds a record with a reference range. That will be the reference range you see on the display.


# CONSTRUCTION ZONE BELOW

Haven't built out this blog post just yet...


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

