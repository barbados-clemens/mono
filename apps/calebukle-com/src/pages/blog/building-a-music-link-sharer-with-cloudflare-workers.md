---
layout: '../../layouts/BlogPost.astro'
title: Building a Music Link Sharer with Cloudflare Workers
description: Look into how I built my own music link sharer service, all on the network edge. ⚡
author: Caleb Ukle
publish_date: 2020-09-07
img: https://s3.amazonaws.com/media.calebukle.com/uploads/music/vinyl-placeholder.jpg
tags:
  - Cloudflare
  - Music
  - Serverless
  - Blog
---

> Check out the
> [link sharer in action](https://music.calebukle.com/?l=acbb167-good-times-willie)

## Why make this?

I wanted a way I could share links to music with friends, but everyone has their
own music service they like to listen to. I could have used a service which does
this, but those typically come with their own analytics tracking, or cost money,
and don't allow me to use my own domain. So as most of my projects start "FINE!
I'll do it myself!"

## How it works

I use [Cloudflare workers](https://workers.cloudflare.com/) to intercept all
requests on a subdomain, i.e. music.domain.com, and return just some static
HTML. The HTML is populated with data from
[Cloudflare KV Store](https://developers.cloudflare.com/workers/learning/how-kv-works)
data. Where the key is passed in via the URL query params, i.e.
`?l=acbb167-good-times-willie`. The data that comes back is just a list of
services and a link to the albumn/song/artist.

Here is a JSON records stored in the KV store.

> You can add `data=1` to the link to view the JSON directly from each key.
> [Here is the data seen below](https://music.calebukle.com/?l=acbb167-good-times-willie&data=1)

```json
{
	"type": "Album",
	"name": "Good Times by Willie Nelson",
	"img": "https://s3.amazonaws.com/media.calebukle.com/uploads/music/acbb167-good-times-willie.jpg",
	"links": [
		{
			"service": "Tidal",
			"link": "https://listen.tidal.com/album/1760153"
		},
		{
			"service": "Spotify",
			"link": "https://open.spotify.com/album/36pKx43hkeUF1OGxuxKkZw"
		},
		{
			"service": "Apple Music",
			"link": "https://music.apple.com/us/album/good-times/278443234"
		},
		{
			"service": "Pandora",
			"link": "https://www.pandora.com/artist/willie-nelson/good-times/ALtl6h7Zq3kxnk9?part=ug-desktop&corr=153729558"
		},
		{
			"service": "Amazon Music",
			"link": "https://music.amazon.com/albums/B0017VP7CM"
		},
		{
			"service": "YouTube Music",
			"link": "https://music.youtube.com/playlist?list=OLAK5uy_mTFHzUNuXX2bJEGLPQfxcASWnFkT49EzA"
		}
	],
	"b64": "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAUABQDASIAAhEBAxEB/8QAGwABAAEFAQAAAAAAAAAAAAAAAAQBAgMFBwb/xAAjEAABBAEEAgMBAAAAAAAAAAABAgMEEQAGEhMhMUEFUWEV/8QAFwEBAQEBAAAAAAAAAAAAAAAAAgEABP/EABwRAAMAAgMBAAAAAAAAAAAAAAABEQIDISIxQf/aAAwDAQACEQMRAD8A83C1hq2M7JaYeceacaSEl8DahV2VDrz6vK6P1rMhyf5vyhfXIkqPFKVIUSpdAbVWeh1583kdhprslSyf05n06xGE6Q8plCnWW3Ni1JsgkDx9e848uyaZNe5rmHSI+vVsN8cv4qK66k0VNlVH6sqsk4zny+FS1EoFk4wp5JSge2uw1DTit1XkiHIWwJRRR3p7v1dC8Yx/Qrws5VfmMYyGh//Z"
}
```

## Why base64 image?

Those eagle eyed among you might notice I have a base 64 string of the image. I
use a low res, 20 pixels wide, image to allow me to _blur up_ the images when
loading the page. This allows for a fast experience and prevents layout shifts
as the full image is loaded in the background.

## Damn, this site is Fast AF. How'd you do that?

We'll the site is a straight rendered HTML site,

- No analytics
- No frameworks
- No (unnecessary) JavaScript
  - More on that later

It also helps that the site runs on the
[Cloudflare edge network](https://www.cloudflare.com/network/), meaning the
server responding is very close to you, instead on the other side of the world.
All the work reading from KV and writing the HTML data takes 1.2ms on average,
and the worst cases are sub 2ms. The rest of the time is spent on transferring
the tiny 3.60 KB, [Brotli encoded](https://en.wikipedia.org/wiki/Brotli), text
to your browser.

![All Cloudflare worker time is <2ms](https://s3.amazonaws.com/media.calebukle.com/uploads/2020/09/hm-ngquZIj3%402x.png)

### JS Exceptions

I have a small about of JavaScript to enable a few features on the site.

1. 25 lines of JS to allow images to blur in a smooth transition.
1. 16 lines of JS for allowing use of the
   [native sharing](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
   of devices like mobile share sheets

Here is the code for blur-ing up images

> I also use this trick on this very blog site.
> [Check out my blur up plugin write up to learn more](https://calebukle.com/blog/blur-up-fade-in-images-without-gatsby-a-scully-plugin)

```js
const imageWrappers = document.querySelectorAll('.img-wrapper');
for (let i = 0; i < imageWrappers.length; i++) {
	const imgWrap = imageWrappers[i];
	const imgEl = imgWrap.querySelector('img');
	const onImageComplete = () => {
		imgEl.style.opacity = 1;
		imgEl.style.filter = null;
		imgEl.style.color = 'inherit';
		// imgEl.style.boxShadow = 'inset 0 0 0 400px white'
		imgEl.removeEventListener('load', onImageLoad);
		imgEl.removeEventListener('error', onImageComplete);
	};
	const onImageLoad = () => {
		imgEl.style.transition = 'opacity .4s cubic-bezier(0.4, 0.0, 0.2, 1)';
		onImageComplete();
	};
	imgEl.style.opacity = 0;
	imgEl.style.filter = 'blur(10px)';
	imgEl.style.transform = 'scale(1)';
	imgEl.addEventListener('load', onImageLoad);
	imgEl.addEventListener('error', onImageComplete);
	if (imgEl.complete) {
		onImageComplete();
	}
}
```

Here is the code for the native sharing abilities.

> Check out the
> [`navigator.share()` api](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)

```js
let shareSheet = document.querySelector('#share-sheet');
if (navigator.canShare && navigator.canShare({ url: location.href })) {
	shareSheet.innerHTML = '${shareable}';
} else {
	console.debug('Unable to use native share sheet');
}

function shareMe() {
	if (navigator.canShare && navigator.canShare({ url: location.href })) {
		// TODO make this work on subsequent shares without throwing errors
		navigator
			.share({ url: location.href })
			.then((res) => console.log('shared!', res))
			.catch((e) => {
				console.error(e);
				alert(e.toString());
			});
	}
}
```

The site will still work if JavaScript is disabled. These are just progressive
enhancements. Though, native share sheets won't work without JavaScript enabled,
but I have default social sharing, twitter/facebook/email, available as a
fallback.

## Other Neat Tricks

The site also will list all links that I've added by going directly to
[music.calebukle.com](https://music.calebukle.com)

You can also _search_ for music across the platforms by passing a query into the
url `https://music.calebukle.com/?q=some cool song`. This doesn't _search_ the
sites, but provides direct links to those search results in the respective
platforms. I would like to make this more ergonomic to use for others.

## Adding a New Item

> Right now only I can add items, but I'd like to allow other people to add
> items, with my approval.

The workflow for adding a new item to the site isn't that _graceful_. You can
see that with my current workflow.

1. Open the Cloudflare KV Store dashboard, copy and paste an old record to a
   JSON formatter
2. Perform a _search_
   `https://music.calebukle.com/?q=some music I want to share`
3. Go to each link, find the correct result
4. Copy and paste the link to the respective link in the JSON
5. Find the album art link and add to the JSON
6. Save a unique key, currently is a hash of the search plus some text to
   identify the album
7. Run a local script to generate all the missing base64 images.

- There's a default base64 image if I haven't done this yet.

1. Done

## Next Steps

1. Having a form to submit the data would be a great start.
2. I also like the idea of having the base64 image converter ran on a schedule
   instead of by hand.
3. It could also be novel idea to allow users to submit PRs to adding links and
   using a CI/CD pipeline to add them to the KV store.
4. Add a useful 404 page
5. Actually use
   [HTML Rewriter](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter),
   instead of `string.replace()`
6. Add any other music services used by friends

   - Reach out if I'm missing your favorite

7. Add Easter Eggs 😉

> [Check out the source code](https://gitlab.com/caleb-ukle/music-url-links)
