---
layout: '../../layouts/BlogPost.astro'
title: Mapbox, Deck.gl, and Angular for Realtime Data Visualization
description: Recently, I was inspired by Jeff from fireship.io with his video over data visualization using deck.gl and google maps. I wanted to tinker with using a framework (angular) and Mapbox to make a realtime data visualization.
author: Caleb Ukle
publish_date: 2019-11-10
img: https://cdn.doubleuideas.com/blog/mapbox-deckgl-getting-started/update-viz.gif?auto=format
tags:
  - Angular
  - Mapbox
  - Deck.gl
  - Data Science
  - Blog
---

[Link to fireship.io tutorial](https://fireship.io/lessons/deckgl-google-maps-tutorial/)

![Datapoints Updating](https://cdn.doubleuideas.com/blog/mapbox-deckgl-getting-started/update-viz.gif?auto=format)

> Disclaimer: I've spent around 5 hours exploring deck.gl for a singular purpose
> of trying to get data points to render from a stream of new data. so I might
> not hit all your questions/needs. Also, I don't claim to be an expert on
> deck.gl, Mapbox, Angular, data science, etc.

First, let's understand the goal we are trying to achieve in this blog post.

1. Get an angular app running with a Mapbox map
1. Add deck.gl library on top of our map
1. Add some realtime data visualization
1. Have fun learning :)

Okay, let's go over some prerequisites for this tutorial

- [Node.js](https://nodejs.org/en/download/) and
  [Angular CLI](https://cli.angular.io/) installed in your working environment
- A Mapbox access token
  - You can sign up for a mapbox account (for free)
    [here](https://account.mapbox.com/auth/signup/)

## ➡️ ️[Working Example Demo](https://gitlab.com/caleb-ukle/ng-mapbox-deckgl-demo)

Awesome, now let's get started.

## Setup

Run `ng new mapbox-deck-viz --style=scss --routing` in the terminal to generate
a new angular app. Now let's install some dependencies, we are only working with
a scatter plot today, but you want other layer types make sure to import that
library if needed. i.e. aggregation-layers for Hexagon Layers

```bash
npm install @deck.gl/{core,layers,mapbox} mapbox-gl @types/mapbox-gl
```

> Note: there are no type definitions for deck.gl which is what made this
> project hard, along with most examples being for the react library instead of
> plain js.

Let's add the Mapbox access token to our `environment.ts`

```ts
export const environment = {
	production: false,
	mapbox: {
		accessToken: '', // Your access token goes here
	},
};
```

Now to tell Mapbox what our access token is. In `app.module.ts` add this code

```ts
import { HttpClientModule } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import * as mapbox from 'mapbox-gl';
(mapbox as any).accessToken = environment.mapbox.accessToken;
```

Now let's head to `app.component.html` to set up our map markup

```html
<div #mapEl class="app-main"></div>
```

## Generate Map Service

Before we start setting up our map, we need to generate a service that will
maintain our map instance, so we can use it throughout our app, and not run into
any issues where the map isn't loaded before we start trying to use it.

Generate a map service `ng g s services/map/map`

In the Map service, we just generated, add the following code in the
`MapService` class and add any missing imports

```ts
map = new AsyncSubject<Map>();
constructor(
  private http: HttpClient
) {
}

getData(file = 1): Observable<any> {
  return this.http.get<any>(`../../../assets/data.${file}.json`);
}
```

Back to our `app.component.ts`. Add the following code in `AppComponent` and add
any missing imports

> Hint: Map and Navigation Control are from 'mapbox-gl' node module

```ts
@ViewChild('mapEl', {static: true})
mapEl: ElementRef<HTMLDivElement>;

private map: Map;

constructor(
  private mapSrv: MapService
) {
}

ngAfterViewInit(): void {
  this.map = new Map({
    container: this.mapEl.nativeElement,
    style: 'mapbox://styles/mapbox/dark-v9',
     center: {lng: -102.380979, lat: 35.877742},
     zoom: 4,
     pitch: 20,
    attributionControl: false
  });
  this.map.addControl(
    new NavigationControl({
      showZoom: true,
      showCompass: true,
      visualizePitch: true,
    }),
    'top-right'
  );
  this.mapSrv.map.next(this.map);

  this.map.on('load', () => {
    console.log('map loaded');
    this.mapSrv.map.complete();
  });
}
```

What this code is doing is initializing the map with the United States
_basically_ centered in the middle of the screen and adds basic navigation
controls in the top right once the app is loaded via the mapbox-gl library

Now we need to add some styles so our map is full screen. In
`app.component.scss` add the following code

```css
.app-main {
	height: 100vh;
	width: 100vw;
}
```

remove the default margin and padding on the browser

```css
/* styles.scss */
html,
body {
	margin: 0;
	padding: 0;
}
```

run `ng serve -o` in the projects root directory via the terminal and you should
get a page that looks like this.

> Hint: don't forget to import `HttpClientModule` in your `app.module.ts` file

✅ Mapbox map in an Angular app. 🎉

## Add Deck.gl

Onto step 2, let's get some data to visualize.

We are going to use the same data found in
[Jeff's video](https://fireship.io/lessons/deckgl-google-maps-tutorial/), but we
are going to for _realtime_ data, we are going to _split_ the data into two
files. You can try moving half the data or just copy the first couple thousand
lines from the source file. We just need to see the data change. Save the two
different data sets as `data.1.json` and `data.2.json` in the assets folder, or
you can download them
[here](https://gitlab.com/caleb-ukle/ng-mapbox-deckgl-demo/tree/master/src/assets)

Now let's make a scatter plot on our map. Head to your `app.component.ts` file
and add the following code.

```ts
setLayers(m: Map, data: any): Observable<Map> {
    const scatter = new MapboxLayer({
        id: "scatter",
        type: ScatterplotLayer,
        data,
        source: "scatter",
        opacity: 0.8,
        filled: true,
        radiusMinPixels: 2,
        radiusMaxPixels: 5,
        getPosition: d => [d.longitude, d.latitude],
        getFillColor: d =>
        d.n_killed > 0 ? [200, 0, 40, 150] : [255, 140, 0, 100],
        pickable: true,
        onHover: ({ object, x, y }) => {
            if (!!object) {
                console.log(object, x, y);
            }
        }
    });

    m.addLayer(scatter);
    return of(m);
}

ngOnDestory() {
    this.mapSrv.map.subscribe(glMap => {
        glMap.removeLayer("scatter");
    });
}
```

The `setLayers` function creates a scatter plot layer with the passed in data.

What is important here is the `new MapboxLayer` constructor. This is from the
`@deck.gl/mapbox` node module. This class implements the custom layer interface
for Mapbox to use on it's map. Because there isn't any typing information on
these libraries, I wasn't sure what properties were supposed to go on the passed
in object. The answer here is the constructor takes an object with a unique id,
a type that is the name of deck.gl layer type, such as `ScatterplotLayer`, the
rest of the properties are what is required by the deck.gl layer type found in
the
[API documentation](https://deck.gl/#/documentation/deckgl-api-reference/layers/overview).
Once you know that information you can create any deck.gl layer for Mapbox to
consume. Nice!

Now all we have do call this method in the bottom of the `ngAfterViewInit`
lifecycle hook with our data like so

```ts
this.mapSrv
	.getData(1)
	.pipe(
		switchMap((d) => combineLatest(of(d), this.mapSrv.map)),
		map(([d, glMap]) => {
			return this.setLayers(glMap, d);
		})
	)
	.subscribe();
```

This will now load a scatter plot layer on top of your Mapbox map.

✅ Mapbox map with deck.gl data visualization layer

## Wire up Realtime Data

Now for the last part, let's add some real-time likeness to the app.

> While this app doesn't use a realtime source of data. It is wired up to where
> data is emitted from a single source so changing a couple lines makes it easy
> to pipe in any data source of your choosing.

According to the deck.gl documentation you should create a new layer every time
there is a data update and deck.gl internally makes a difference in the data and
only update what is needed efficiently. The only issue is I've only seen that
when using `new ScatterLayer` since we are directly adding to Mapbox,
i.e.creating a Mapbox layer then adding that layer to the map. I'm not sure if
this is technically valid to regenerate a layer each time the data changes, but
is the only way I was able to get things working and don't see any documentation
on this specific area of the library. This is an area I'm still experimenting
with. So if you're needing mission critical performance, I can't guarantee
anything.

But without further adieu, let's add some dynamic data to our map.

Let's go to our `app.component.html` and add a button that will change our data,
for now, we are going to manually call update, but this can be easily wired up
with other eventing sources since we are using a Behavior Subject to control
updates.

Add the following code

```html
<button class="updates" (click)="loadData()">Send Update</button>
```

And add this to our `app.component.scss` file as well.

```css
button.updates {
	position: fixed;
	right: 100px;
	top: 100px;
}
```

and in `app.component.ts` add the `loadData()` function which will load our
other data json file like so.

```ts
loadData() {
  this.mapSrv.getData(2)
    .subscribe();
}
```

Great! now when we click our button we'll fetch our new json file, But we need
to render the new data when it changes. So in our `map.service.ts` we'll need to
add a Behavior Subject to keep track of our state. Add the following code

```ts
mapDataSub = new BehaviorSubject<any>(null);
mapData$ = this.mapDataSub.asObservable();
```

now back to our `app.component.ts` file. We'll need to change how we are
fetching our data initially. Modify the code in the `ngAfterViewInit` lifecycle
method to look like so

```ts
ngAfterViewInit(): void {
    this.mapSrv.mapData$
        .pipe(
            switchMap(d => combineLatest(of(d), this.mapSrv.map)),
            map(([data, glMap]) => {
                return this.setLayers(glMap, data)
            })
        )
        .subscribe()

    this.mapSrv.getData(1)
        .subscribe(d => this.mapSrv.mapDataSub.next(d))

    this.map = new Map({
        container: this.mapEl.nativeElement,
        style: 'mapbox://styles/mapbox/dark-v9',
        center: { lng: -102.380979, lat: 35.877742 },
        zoom: 4,
        pitch: 20,
        attributionControl: false
    });

    this.map.addControl(
        new NavigationControl({
            showZoom: true,
            showCompass: true,
            visualizePitch: true,
        }),
        'top-right'
    );

    this.mapSrv.map.next(this.map);

    this.map.on('load', () => {
        console.log('map loaded');
        this.mapSrv.map.complete();
    });
}
```

What we are doing here is setting up a subscription to our data stream and
calling the first file to be sent into the stream. If you run the example right
now nothing will happen because we need to emit the new data from the second
data file.

In `loadData`, change the code to match like so

```ts
this.mapSrv.getData(2).subscribe((d) => this.mapSrv.mapDataSub.next(d));
```

Almost there we still need to make one change in out `setLayers` method. At the
beginning of the method add the following code.

```ts
const layer = m.getLayer('scatter');
if (!!layer) {
	m.removeLayer('scatter');
}
// Rest of function
```

Now our map will delete the layer if it exists and readd the layer with the new
data.

When you click the update button you should see the data change. Yay! 🥳

✅ Realtime Data

## Done

We have a

- ✅ Mapbox map in Angular
- ✅ Deck.gl layer on top of our Mapbox Map
- ✅ _Real time_ data visualization

## Realtime for Real

While this app we've written isn't real time, I hope you can see how easily it
can change into real time. All you need to do is call `.next` on the
`mapDataSub` Behavior Subject and the subscription we've written in
`ngAfterViewInit` will fire calling the `setLayers` method rebuilding our
visualization layer. Of course these methods can be abstracted out a bit more
and cleaned up, but you're smart and I believe in you!

Let me know if you come up with any ways to handle the rebuilding of layers.
Have a good day! 😃
