---
layout: '../../layouts/BlogPost.astro'
title: My First Machine, Getting Started with XState and Angular
description: I have long been interested in XState, a JavaScript state machines and statecharts library. Up until this point I've not found a reason to use a state management library, but XState has really piqued my interest.
author: Caleb Ukle
publish_date: 2020-09-11T05:00:15.378Z
img: https://cdn.doubleuideas.com/blog/first-machine/bill-oxford--machine-unsplash.jpg?auto=format
tags:
  - XState
  - Angular
  - Blog
---

The reason [XState](https://xstate.js.org/docs/) caught my attention is mainly
it's creator, [David Khourshid](https://github.com/davidkpiano). Specifically,
Davids passion and enthusiasm about state machines and state charts really draws
me in. It also helps that state machines were a topic covered in my engineering
degree. So getting to use something I learned in college directly is always a
bonus. So I decided to set out on trying to use XState in a real world example,
and the real world for me is building web apps with Angular.

For the uninitiated [XState](https://xstate.js.org/docs/) is a
[finite state machine]() and [statechart]() library for JavaScript

I'm not going to go into the whys, pros vs cons or "How To" of XState in this
post. This post is more of a stream of stream of consciousness on how I built my
first machine. Primarily as a record for how my brain works with XState.

## Wait no state management libraries?

> _"Gasp! you mean you've never used [ngrx](https://ngrx.io/),
> [ngxs](https://www.ngxs.io/), [akita](https://datorama.github.io/akita/) or
> [Whatever is currently in fashion]"_ - probably you

Yeah that's right. I've never used, or really needed the assistance of other
well known state management libraries.

[Angular services](https://angular.io/guide/architecture-services),
[facades](https://en.wikipedia.org/wiki/Facade_pattern), and
[reactive programming](https://en.wikipedia.org/wiki/Reactive_programming) via
[RxJS](https://rxjs.dev/) has gotten me through pretty much everything I needed.
There have been a few cases where building a somewhat more complex item where a
_structured_ system (aka state libraries) would have been easier, but never
really needed it at the end of the day.

## Okay so why use a state library now?

Mostly out of curiosity and XState really struck a chord with me. Mainly was how
[David talked about the library](https://syntax.fm/show/206/state-machines-css-and-animations-with-david-k-piano)
and you can just hear that passion. It's infectious.

So I decided to kick the tires a little and give it a shot.

## My First Machine

So my first self assigned task was to use XState to power the logic behind a
_simple_ search frontend app I built for work, powered by
[Meilisearch](https://www.meilisearch.com/). The app is pretty simple.

1. User types into a search box
1. Query is sent to an api after 300ms of typing inactivity
1. Transform the result some
1. Display the results

The first task is to figure out where my _Machine_ will go. That is decently
straight forward as the entire idea of the Machine is to take over the state and
logic about how state transitions can occur.

## Okay, so how do use this thing?

Well I know where I want to put XState into my app, but how do I do that? I've
figured out it's easy to start by _typing_ out the TypeScript interfaces and
types for it as that forced me learn the scope the machine will take.

So here's what I think will work initially.

```ts
// search.machine.ts

// add this to enable the visualizer, also allow popups
inspect({
	url: 'https://statecharts.io/inspect',
	iframe: false,
});

// what information do I need to store on the machine?
interface SearchContext {
	// I need to know what the user searched for
	query: string;
	// gotta store the results of query will be helpful
	results: SearchResult[];
}

// what are the possible "positions" aka states can I be in?
interface SearchStateSchema {
	states: {
		// initial machine state
		idle: {};
		// doing work
		searching: {};
	};
}

// what triggers movement through my machine?
type SearchEvent =
	// well I need to tell the machine I am making a search
	{ type: 'SEARCH'; value: string } | { type: 'DATA'; value: any[] };
```

Okay that's a good start. I now know what the machine has to do. Let's get basic
configuration added

```ts
// search.machine.ts

const searchMachine = Machine<SearchContext, SearchStateSchema, SearchEvent>({
  id: 'search',
  initial: 'idle',
  states: {
    idle: {
      on: {
        'SEARCH': {
          target: 'searching'
        }
      }
    },
    searching: {
      on: {
        'DATA': {
           target: 'idle'
          }
        }
      }
    }
  }
})
```

Okay so that makes a lot of sense to me from a _movement_ perspective.

> Make sure to check out the awesome new visualizer by David,
> [statecharts.io](https://statecharts.io/). Really helps hammer out what's
> going on with your machines.

Now let's save our search query when sending the `SEARCH` event.

```ts
// search.machine.ts

idle: {
  on: {
    'SEARCH': {
      target: 'searching',
      actions: assign({
        query: (ctx, event) => event?.value
      })
    }
  }
}
```

Okay so now we are saving our query

### Save Data from API

Okay so now we'd need a way to save any results that come back from any API

> The logic of the API call will be the glue between these two states. We'll do
> that in a bit

Let's add an event that will handle this

```ts
// search.machine.ts

searching: {
  on: {
    'DATA': {
      target: 'idle',
      actions: assign({
        results: (ctx, event) => event?.value
      })
    }
  }
}
```

### Make the API Call

In order to have data returned from our call, we need to return an event that
XState can understand. We set up a `DATA` event earlier so that's what we'll
need to return. `{type: 'DATA', value: string[]}`

> For now we will simulate our API call

```ts
// search.machine.ts

// should return {type: 'DATA', value: string[]} as an observable
const doSearch = (ctx, event) => {
	return of(event.value).pipe(
		delay(2000), // network delay
		map((value) => ({
			type: 'DATA',
			value: [value, `${value}, ${value}`, `${value}, ${value}, ${value}`],
		}))
	);
};
```

Now we need to add this to our services and invoke it.

```ts
searching: {
  invoke: {
    src: doSearch,
    onDone: 'idle'
  }
}
```

Alright, so that should trigger our _DATA_ event which assigns the returned
value into our machines context, specifically `context.results`

At this point we should be able to send the `SEARCH` event via the state chart
visualizer

```json
{
	"type": "SEARCH",
	"value": "my query"
}
```

![Search event via state chart visulizer](https://cdn.doubleuideas.com/blog/first-machine/event-panel.png?auto=format)

After sending that event we should have the `DATA` event trigger that contains
the _search results_

```json
{
"type": "DATA",
"value: [
  "my query",
  "my query,my query",
  "my query, my query, my query"
  ]
}
```

![Data event via state chart visulizer](https://cdn.doubleuideas.com/blog/first-machine/event-panel-with-data.png?auto=format)

### Prevent Invalid Query

We should add a guard, or condition, to prevent running a search on an empty
query. We can do this by checking the value from the event.

```ts
// search.machine.ts

const isValidSearch = (ctx, event) => event?.value?.length > 0

idle: {
  on: {
    'SEARCH': {
      target: 'searching',
      actions: assign({
        query: (ctx, event) => event?.value
      }),
      cond: (ctx, event) => event?.value?.length > 0,
    }
  }
}
```

### Add Angular to the Party

So now that we have a working machine, let's add it to our Angular app.

Make a service service for
[DI](https://en.wikipedia.org/wiki/Dependency_injection). `ng g s search`

Now consume the machine.

```ts
// search.service.ts

private machineSrv = interpret(searchMachine, {devTools: true})
.start()

state$ = from(this.machineSrv)
.pipe(
  filter(state => state.changed), // we only want to emit when the state has changed
)

send(query: string): void {
  this.machineSrv.send('SEARCH', {value: query})
}
```

Make a component to use our `search.service.ts`, `ng g c search`

In `search.component.ts`,

```ts
// search.component.ts

inputControl = new FormControl('')

constructor(
  public searchSrv: SearchService
) { }

ngOnInit(): void {
  this.inputControl.valueChanges
  .pipe(
    // wait 300 ms for user to stop typing
    debounceTime(300),
    distinctUntilChanged(),
  )
  .subscribe(value => this.searchSrv.send(value))
}
```

And finally some markup

```html
<p>
	<input type="text" [formControl]="inputControl" />
</p>
<p>input: {{ inputControl.valueChanges | async }}</p>
<ng-container *ngIf="searchSrv.state$ | async as state">
	<p>Machine Query: {{ state?.context?.query }}</p>

	Results:
	<br />
	<ul>
		<li *ngFor="let r of state?.context?.results">{{ r }}</li>
	</ul>

	<hr />

	State:
	<br />
	<pre>{{ state | json }}</pre>
</ng-container>
```

Okay! That should give us a working machine in Angular.

> [Here's the Stackblitz to try for yourself](https://stackblitz.com/edit/ng-xstate-search?embed=1&file=src/app/search.machine.ts)

## The Problem

While this machine works, it misses one important UX part. Being able to cancel
the ongoing request when a user types a new request while the ongoing request is
pending.

You can see this by typing something in the input, wait a second then type more.
The second query doesn't execute because the machine is in the `searching` state
and not able to handle the 'search' event.

This is simple with plain RxJS by using the `switchMap` operator.

```ts
searchResults$ = this.inputControl.valueChanges.pipe(
	/// debounce and filter stuff
	switchMap((query) => doSearch(query))
);
```

So the question is how do I achieve this same _logic flow_ with XState?

## The Solution

> There might be a _more_ correct way of achieving this result as I'm only
> starting with XState.

According to the documentation when using services, i.e. the `invoke` part of
our machine, with a promise or observable the promise is discarded and
observable unsubscribed from when moving out of that state. Perfect! so we just
need to allow the machine to exit that state when a new query is issued;
therefore, canceling the on going service.

Here's the Exact wording

> If the state where the invoked promise is active is exited before the promise
> settles, the result of the promise is discarded.

and for Observerables

> The observable is unsubscribed when the state where it is invoked is exited.

So to allow the state to exit we need to re-transition into the searching state.
To do this we just need to _lift_ the `SEARCH` event to the root level of our
machine, instead of keeping it in the `idle` state. this allows for a search to
happen at any time in the machine.

```ts
// search.machine.ts

states: {
  idle: {},
  searching: {},
  on: {
    SEARCH: {}
  }
}
```

Now when we try to run those _searches_ we can see our state is correctly
reflected and discarding the current query if a new one appears.

## Extras

If we are working with a Promise instead of an Observable. then we can use the
'onDone' to handle the promise resolving where `event.data` will contain the
result of the promise. This means we could remove out `DATA` event from above.

```ts
// search.machine.ts

invoke: {
  src: doPromiseSearch,
  onDone: {
    target: 'idle',
    actions: assign({
      results: (ctx, event) => event.data
    }),
  }
}
```

We can also add some extra states to our machine to help with UI/UX on the
consuming side to handle our Promise rejecting or handle an error that occurs
when executing our service.

```ts
// search.machine.ts

states: {
  idle: {},
  error: {},// empty because when the next search comes through it'll transition into searching
  searching: {}
}
```

and update our service invocation

```ts
// search.machine.ts

invoke: {
  src: doPromiseSearch,
  onDone: {
    target: 'idle',
    actions: assign({
      results: (ctx, event) => event.data
    }),
  },
  onError: {
    target: 'error'
  }
}
```

## Wrap Up

That wasn't so bad. The hardest part of this machine was figuring out the
`SEARCH` event needed to go at the root of the machine.

Other parting thoughts.

1. XState docs are pretty good.
1. XState greatly simplifies the Angular aspect of the code.
1. UI/UX is simplified because the current state is known. Derive views from
   that info.

![Actually app this machine is used for](https://cdn.doubleuideas.com/blog/first-machine/search-demo.gif?auto=format)
