---
layout: '../../layouts/BlogPost.astro'
title: Building a Formula 1 Dashboard with iOS 14 Widgets
description: iOS 14 introduce a breakthrough new feature called widgets. Never has the world seen such innovation in mobile phone operating system features. Um, well okay yeah not really, but hey we got this feature so why not use it. Here is how I built myself a little dashboard for all my Formula 1 wants, and how you can do it too!
author: Caleb Ukle
publish_date: 2020-09-21
img: https://media.calebukle.com/uploads/2020/09/ios14-f1-dashboard.png
tags:
  - iOS
  - F1
  - JavaScript
  - Blog
---

![My F1 Dashboard on iOS 14](https://media.calebukle.com/uploads/2020/09/ios14-f1-dashboard.png)

Of the 4 widgets on my dashboard only 2 are custom ones. The other two are from
[Apollo, an iOS Reddit client](https://apolloapp.io/).

My two custom widgets include showing the time until the next F1 event and the
latest articles from [f1.com](https://www.formula1.com/en/latest.html).

My custom widgets are built with the [Scriptable App](https://scriptable.app/).
This app allows you to write JavaScript and access certain iOS native apis
though JavaScript. Also, some how this app is free?? Crazy! Go support it's
creator [Simon B. Støvring](https://twitter.com/simonbs), by leaving a tip in
app.

## Time Until Next Event

This widget takes a calendar, grabs the most recent event (within the next 30
days), formats the data, and displays it as X time until Y event. This widget
works best as a small widget.

> It seems like the Calendar app already handles all the Timezone date
> wrangling. Or at least it lines up when I use it.

![Time until next event widget display example](https://s3.amazonaws.com/media.calebukle.com/uploads/2020/09/time-until-next-f1-event.png)

### How To Use

1. Download [Scriptable](https://scriptable.app/)
1. Add an [F1 Calendar](https://f1calendar.com/) to your device
   - I used [f1calendar.com](https://f1calendar.com/)
1. Open your calendar app and get the name of your f1 calendar.
   - The name for all events from [f1calendar.com](https://f1calendar.com/) is
     `f1calendar.com/download/f1-calendar_p1_p2_p3_q_gp.ics`
1. Copy the code snippet below and paste it into your script.
   - If you're using a different calendar name then update the `calName`
     variable.
   - i.e. `let calName = "my-other-f1-calendar-name-from-the-calendar-app"`
1. Press play on the Scriptable app and view the widget.
1. Fiddle with the code to get just to your liking.
1. Place on home screen
1. Enjoy

```js
// timeUntilNextEvent.js

// Get the F1 calendar on your device and display the next event in relative time

// Calendar name to grab events from. Find this in your calendar app
let calName = "f1calendar.com/download/f1-calendar_p1_p2_p3_q_gp.ics";
// get the calendar
let cal = await loadCalendar(calName);
// format event data
let event = await formatData(cal);
// build widget
let widget = await createWidget(event);
// Check if the script is running in
// a widget. If not, show a preview of
// the widget to easier debug it.
if (!config.runsInWidget) {
  await widget.presentSmall();
}
// Tell the system to show the widget.
Script.setWidget(widget);
Script.complete();

async function createWidget(alt) {
  let gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color("#e10600"),
    new Color("#e10600a8"),
  ];

  let w = new ListWidget();
  // when widget is clicked it'll take us here in the default browser
  w.url = "https://f1.com";

  // if you wanted a background image here is how to do that
  //let imgUrl = "https://i.ndtvimg.com/i/2017-11/f1-logo-2018_827x510_81511713381.png"
  //let imgReq = new Request(imgUrl)
  //let img = await imgReq.loadImage()
  //w.backgroundImage = img

  w.backgroundColor = new Color("#ffffff");
  w.backgroundGradient = gradient;

  if (!alt) {
    w.addSpacer();
    let fallBackTitle = w.addText("No Upcomming Events 😞");
    fallBackTitle.font = Font.boldSystemFont(16);
    fallBackTitle.textColor = Color.white();
    w.addSpacer();

    return w;
  }
  // Add spacer above content to center it vertically.
  //   w.addSpacer()

  // Show headline.
  let titleTxt = w.addText(alt.title);
  titleTxt.font = Font.boldSystemFont(16);
  titleTxt.textColor = Color.white();

  // Add spacing below headline.
  w.addSpacer(8);

  let subtitle = w.addText("at " + alt.loc);
  subtitle.font = Font.mediumSystemFont(12);
  subtitle.textColor = Color.white();
  subtitle.textOpacity = 0.9;

  // Add spacing below
  w.addSpacer(2);

  // show date time
  let dateTxt2 = w.addText("on " + alt.startTime);
  dateTxt2.font = Font.mediumSystemFont(12);
  dateTxt2.textColor = Color.white();
  dateTxt2.textOpacity = 0.9;
  w.addSpacer(2);

  // Show relative time
  let dateTxt = w.addText(alt.timeUntil);
  dateTxt.font = Font.mediumSystemFont(12);
  dateTxt.textColor = Color.white();
  dateTxt.textOpacity = 0.9;
  // Add spacing below content to center it vertically.
  w.addSpacer();
  return w;
}

async function loadCalendar(calName) {
  // get calendar by name, every time I change it to be friendly it gets reset.
  let cal = await Calendar.forEventsByTitle(calName);
  let today = new Date(Date.now());
  // 30 days from now. This will probably show wonky stuff once season is over
  let nextMonth = today.valueOf() + 2592000000;
  let events = await CalendarEvent.between(today, new Date(nextMonth), [cal]);

  return events;
}

// take f1 calendar and get the most recent event and format it.
// lots of dumb TimeZone stuff I'm pretty sure I got wrong, but close enough.
async function formatData(events) {
  let today = new Date(Date.now());

  // time zone stuff that's not needed bc Calendar app handles this
  let tzOffsetHour = today.getTimezoneOffset() / 60;

  // 	today.setHours(today.getHours() - tzOffsetHour)
  let nextMonth = today.valueOf() + 2592000000;
  const dtOpts = {
    hour: "numeric",
    dayPeriod: "short",
    month: "short",
    day: "numeric",
  };
  const fmt = new Intl.DateTimeFormat("en-US", dtOpts);
  const rtf = new Intl.RelativeTimeFormat("en", { style: "narrow" });

  // no events found. return nothing. should handle on display side
  if (events && events.length === 0) {
    return null;
  }
  const nextEvent = events[0];

  let unit;
  let timeVal;
  const startTime = new Date(Date.parse(nextEvent.startDate));

  // Timezone stuff that I think works but don't need
  // 	startTime
  // 	.setHours(startTime.getHours() - tzOffsetHour)

  // time until the event starts in ms
  const startTimeUntil = startTime.valueOf() - today.valueOf();

  // figure out the unit to use the Intl formatter with
  if (startTimeUntil > 86400000) {
    timeVal = startTimeUntil / 1000 / 60 / 60 / 24;
    unit = "day";
  } else if (startTimeUntil > 3600000) {
    timeVal = startTimeUntil / 1000 / 60 / 60;
    unit = "hour";
  } else {
    timeVal = startTimeUntil / 1000 / 60;
    unit = "minute";
  }

  // # debug life
  console.log(JSON.stringify(
    {
      today,
      tzOffsetHour,
      startTime,
      startTimeUntil,
      timeVal,
      unit,
      nextEvent,
    },
    null,
    2,
  ));

  let timeUntil = rtf.formatToParts(timeVal, unit);
  // only get the text and whole numbers spaces come apart of the formatted value btw
  let timeUntilFmt = timeUntil.filter((t) =>
    t.type === "literal" || t.type === "integer"
  )
    .map((t) => t.value).join("");

  // # debug life
  console.log(JSON.stringify(
    {
      timeUntil,
      timeUntilFmt,
      startTime,
    },
    null,
    2,
  ));

  return {
    title: nextEvent.title,
    loc: nextEvent.location,
    timeUntil: timeUntilFmt,
    startTime: fmt.format(startTime),
  };
}
```

## Latest News From F1.com

This widget pulls the latest article titles from
[f1.com](https://www.formula1.com/en/latest.html) and displays the 3 most recent
titles. Works best as a medium widget.

![Latest News Widget Example](https://media.calebukle.com/uploads/2020/09/latest-news.png)

### How To Use

1. Download [Scriptable](https://scriptable.app/).
1. Make a new script
1. Delete any content currently in the script
1. Copy the code snippet below and paste it into your script.
1. Press play on the Scriptable app and view the widget.
1. Fiddle with the code to get just to your liking.
1. Place on home screen
1. Enjoy

```js
// LatestNews.js

// Get the latest news from f1.com

let headlines = await loadItems();
let widget = await createWidget(headlines);

// Check if the script is running in
// a widget. If not, show a preview of
// the widget to easier debug it.
if (!config.runsInWidget) {
  await widget.presentMedium();
}

// Tell the system to show the widget.
Script.setWidget(widget);
Script.complete();

async function createWidget(alt) {
  // add a little red gradient to go over a white background. Feel free to remove and set solid color background
  let gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color("#e10600"),
    new Color("#e10600a8"),
  ];
  let w = new ListWidget();
  // when clicking on the widget open up the page we're pulling from
  // There might be a way to open apps intead of urls. Not sure
  w.url = "https://www.formula1.com/en/latest.html";

  // set white background
  w.backgroundColor = new Color("#ffffff");
  w.backgroundGradient = gradient;

  // if we don't have any data show a message and exit
  if (!alt) {
    let fallBackTitle = w.addText("No News 😞");
    fallBackTitle.font = Font.boldSystemFont(16);
    fallBackTitle.textColor = Color.white();
    w.addSpacer();
    return w;
  }
  alt.forEach((t, idx) => {
    let titleTxt = w.addText(t);
    titleTxt.font = Font.mediumSystemFont(14);
    titleTxt.textColor = Color.white();
    // Add spacing below headline.
    if (idx !== alt.length - 1) {
      w.addSpacer(6);
    }
  });

  w.addSpacer();
  // Add small footer text showing what the widget is.
  // I don't love this tried at the top as well and just didn't look right.
  // Can't get the spacing right.
  let title = w.addText("Formula 1 Latest News");
  title.font = Font.mediumSystemFont(10);
  title.textColor = Color.white();

  return w;
}

async function loadItems() {
  // Ths content is property of it's copyright holders. This is for personal use and not for sale.
  // If you just had an open API people wouldn't have to do this _cough_
  // use https://web.scraper.workers.dev/ to pull in our data.
  let url =
    "https://web.scraper.workers.dev/?url=https%3A%2F%2Fwww.formula1.com%2Fen%2Flatest.html&selector=.f1-cc&scrape=text&spaced=true&pretty=true";

  let req = new Request(url);
  let json = await req.loadJSON();
  // debug city should get an array of titles back nested in a could objects
  console.log(json);

  // access items
  const items = json.result[".f1-cc"];

  // if we got data then return the first 3 items after you clean up their titles or return null

  return items && items.length > 0
    ? items
      .slice(0, 3)
      .map((t) => cleanTitle(t))
    : null;
}

function cleanTitle(line) {
  // remove anything before the : in the title
  return line
    .replace(/&#39;/g, "'") // add back single quotes '
    .replace(/^.+:/g, "") // remove everything before : i.e. Vote Poll : [Title]
    .replace("Feature", "") // this seems to not follow the above rule
    .trim(); // remove any leading or trailing whitespace
}
```
