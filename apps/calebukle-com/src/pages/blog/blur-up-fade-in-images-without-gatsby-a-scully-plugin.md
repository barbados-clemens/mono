---
layout: '../../layouts/BlogPost.astro'
title: Blur Up/Fade In Images Without Gatsby
description: Blurring up images is the act of creating a small image and inlining into a page's markup. The inline-image is stretched out to the original image size and a blur is applied. In the background, the full-sized image downloads and replaces the small blurry image. Since the small image is the same size, the page doesn't jump up or down when adding the image. Here is my implementation for a scully plugin, along with how to do it outside of a framework if desired.
author: Caleb Ukle
publish_date: 2020-04-27
img: https://cdn.doubleuideas.com/blog/blur-up-images/blur-up-example.gif?format=auto
tags:
  - Scully
  - Gatsby
  - Plugins
  - Blog
---

![Sample gif of blur up on Medium.com and for blur up on my site, blur up inception. We need to go deeper!](https://cdn.doubleuideas.com/blog/blur-up-images/blur-up-example.gif?format=auto)

> You can check out the post in the blur up example gif
> [here](https://blog.bitsrc.io/10-useful-angular-features-youve-probably-never-used-e9e33f5c35a7)
> if interested.

Blurring up can be seen across many sites like Medium and Facebook.
[Gatsby.js](https://gatsbyjs.org) has this ability with a
[plugin](https://www.gatsbyjs.org/packages/gatsby-plugin-sharp/), which is
extremely helpful in building jank-free sites with images. If you didn't know, I
am not using Gatsby. I just switched from Gatsby for
[Scully](https://scully.io). You can learn more about my switch
[here](https://calebukle.com/blog/moving-from-gatsby-to-scully-the-angular-static-site-generator).
Since I'm not using Gatsby any more, I need a way to blur up my photos within
Scully.

Here is the game plan

1. Figure out how to make small inline-able images from existing images
1. Generate the markup needed to blur up without JavaScript
1. Use JavaScript to make the transition to look nicer
1. Integrate within Scully via render plugin
1. Move JavaScript to an Angular directive

I figured out most of this by just reading the
[gatsby-remark-images](https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-remark-images/src/index.js),
[gatsby-image-sharp](https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-plugin-sharp/src/index.js)
plugins and the
[Sharp documentation](https://sharp.pixelplumbing.com/api-constructor). So it's
not full proof, but works for my needs and hopefully someone can learn from my
journey of figuring this out.

## Resizing Image

[Sharp](https://sharp.pixelplumbing.com/) is a node package we'll be using for
generating our small images, it's also what is used by Gatsby.

Install sharp using npm. `npm i -D sharp`.

> We'll be using only a few APIs from Sharp. You can check out Sharps
> documentation [here](https://sharp.pixelplumbing.com/api-constructor) if you
> want to see everything it can do.

Alright, so making a 20px wide image is pretty straight forward with sharp.

> Sharp retains the aspect ratio by default for our images.

```js
/**
 * @param {Buffer} data
 * @return {Promise<Buffer>}
 */
async function resize(data) {
	console.log('resizing');
	return await sharp(data)
		.resize(20) // size in px to change width
		.toBuffer();
}
```

I use a `Buffer` as an input into the resize function because my images are on a
cdn already. If you're images are local then just pass the local path to the
image as the `data` input

I use [Axios](https://www.npmjs.com/package/axios) to download my images via url
to an array buffer for usage in this process

```js
// blurUp.helper.plugin.js

/**
 * @param {string} url
 * @return {Promise<AxiosResponse<any>>}
 */
async function download(url) {
	console.log('downloading');
	return axios.get(url, { responseType: 'arraybuffer' });
}
```

✅ Step 1.

## Generate Markup

Now we need to generate the markup for our new blur up image abilities.

This is the markup we are trying to create, with of course the correct image
content

```html
<!--example.html-->

<span
	class="img-wrapper"
	style="padding-bottom: SOME_PERCENT%; 
             position: relative; 
             bottom: 0; 
             left: 0; 
             display: block; 
             background-size: cover;
             background-image: url('data:image/png;base64, BASE64_ENCODED_STRING');"
>
	<img
		class="img-sharp"
		alt="some-alt"
		title="some-title"
		src="data:image/png;base64, BASE64_ENCODED_STRING"
		srcset="https://SOMEIMAGE.PNG"
		sizes="1080"
		style="width: 100%; 
         height: 100%; 
         margin: 0; 
         vertical-align: middle; 
         position: absolute; 
         top: 0; 
         left: 0;"
	/>
</span>
```

Before we can generate the markup, we need to get all the pieces of data to
build the markup

1. A base64 encoded string of the small image
1. Screen percentage the original image would take

Luckily Sharp makes this easy as well.

### Base64 Image

First, we'll need to convert our small image into a base 64 string.

```js
// blurUp.helper.plugin.js

/**
 * @param {Buffer} data
 * @return {string}
 */
function toBase64(data) {
	console.log('making base 64 image');
	return Buffer.from(data).toString('base64');
}
```

Great! Now we have a base64 string representing our tiny image. Time to get our
image screen percentage.

### Get Image Percentage

Now we need to get the percentage of the screen the image would have taken up.
This will make sure our small element fills the same space as our normal-sized
image. To do this we need to take the height divided by the width and multiple
it by 100. Here is that helper function.

```js
// blurUp.helper.plugin.js

/**
 * @param {Buffer} data
 * @return {Promise<number>}
 */
async function getImgPadding(data) {
	console.log('getting metadata');
	const { height, width } = await sharp(data).metadata();
	return (height / width) * 100;
}
```

Now we can build our markup.

### Build Markup

There was an issue when I tried doing this by interpolating values into an HTML
string. I kept getting escaped HTML markup instead of the actual HTML, so here I
make an object representing what I want the markup to be. You can try string
interpolating the data into the string of HTML and see if that works for you.
Potentially could be easier depending on your build system workflow. Since I'm
using Scully, it's just as easy to use this abstract representation.

```js
// blurUp.helper.plugin.js

/**
 * @param {number} paddingBottom
 * @param {string}b64
 * @param {string}caption
 * @param {string}imgUrl
 * @return {{children: [{tagName: string, props: {sizes: string, src: string, alt: string, style: string, title: string, srcset: string, class: string}}], tagName: string, props: {style: string, class: string}}}
 */
function buildAst({ paddingBottom, b64, caption, imgUrl } = data) {
	return {
		tagName: 'span',
		props: {
			class: 'img-wrapper',
			style: `padding-bottom: ${paddingBottom}%;
                 position: relative;
                 bottom: 0;
                 left: 0;
                 display: block;
                 background-size: cover;
                 background-image: url('data:image/png;base64,${b64}');`,
		},
		children: [
			{
				tagName: 'img',
				props: {
					class: 'img-sharp',
					src: `data:image/png;base64,${b64}`,
					alt: `${caption}`,
					title: `${caption}`,
					srcset: `${imgUrl}`,
					sizes: '1080',
					style: `width: 100%;
                      height: 100%;
                      margin: 0;
                      vertical-align: middle;
                      position: absolute;
                      top: 0;
                      left: 0;`,
				},
			},
		],
	};
}
```

If you were going to interpolate the values this is what it would look like

```js
// blurUp.helper.plugin.js

/**
 * @param {number} paddingBottom
 * @param {string}b64
 * @param {string}caption
 * @param {string}imgUrl
 * @return {{children: [{tagName: string, props: {sizes: string, src: string, alt: string, style: string, title: string, srcset: string, class: string}}], tagName: string, props: {style: string, class: string}}}
 */
function buildMakrup({ paddingBottom, b64, caption, imgUrl } = data) {
	return `<span class="img-wrapper"
                style="padding-bottom: ${paddingBottom}%; 
                       position: relative; 
                       bottom: 0; 
                       left: 0; 
                       display: block; 
                       background-size: cover;
                       background-image: url('data:image/png;base64, ${b64}');"
          >
              <img
                class="img-sharp"
                alt="${caption}"
                title="${caption}"
                src="data:image/png;base64, ${b64}"
                srcset="${imgUrl}"
                sizes="1080"
                style="width: 100%; 
                       height: 100%; 
                       margin: 0; 
                       vertical-align: middle; 
                       position: absolute; 
                       top: 0; 
                       left: 0;"
              />
          </span>`;
}
```

### Putting it all together

The entire pipeline should look something like this

```js
// blurUp.helper.plugin.js

const axios = require('axios');
const sharp = require('sharp');

/**
 * @param {string} url
 * @return {Promise<AxiosResponse<any>>}
 */
async function download(url) {
	console.log('downloading');
	return axios.get(url, { responseType: 'arraybuffer' });
}

/**
 * @param {Buffer} data
 * @return {Promise<Buffer>}
 */
async function resize(data) {
	console.log('resizing');
	return sharp(data).resize(20).toBuffer();
}

/**
 * @param {Buffer} data
 * @return {string}
 */
function toBase64(data) {
	console.log('making base 64 image');
	return Buffer.from(data).toString('base64');
}

/**
 * @param {Buffer} data
 * @return {Promise<number>}
 */
async function getImgPadding(data) {
	console.log('getting metadata');
	const { height, width } = await sharp(data).metadata();
	return (height / width) * 100;
}

/**
 * @param {number} paddingBottom
 * @param {string}b64
 * @param {string}caption
 * @param {string}imgUrl
 * @return {{children: [{tagName: string, props: {sizes: string, src: string, alt: string, style: string, title: string, srcset: string, class: string}}], tagName: string, props: {style: string, class: string}}}
 */
function buildAst({ paddingBottom, b64, caption, imgUrl } = data) {
	const markup = {
		tagName: 'span',
		props: {
			class: 'img-wrapper',
			style: `padding-bottom: ${paddingBottom}%;
             position: relative;
             bottom: 0;
             left: 0;
             display: block;
             background-size: cover;
             background-image: url('data:image/png;base64,${b64}');`,
		},
		children: [
			{
				tagName: 'img',
				props: {
					class: 'img-sharp',
					src: `data:image/png;base64,${b64}`,
					alt: `${caption}`,
					title: `${caption}`,
					srcset: `${imgUrl}`,
					sizes: '1080',
					style: `width: 100%;
                  height: 100%;
                  margin: 0;
                  vertical-align: middle;
                  position: absolute;
                  top: 0;
                  left: 0;`,
				},
			},
		],
	};
	return markup;
}

async function newImgMarkUp(imgUrl, caption) {
	const { data } = await download(imgUrl);

	if (!data) {
		throw Error('no image found');
	}

	const resized = await resize(data);

	const b64 = toBase64(resized);

	const paddingBottom = await getImgPadding(resized);

	return buildAst({ b64, paddingBottom, caption, imgUrl });
}

module.exports.newImgMarkUp = newImgMarkUp;
```

> The caption property is for setting alt and title attributes on the image tag

If you were to run the code right now you'd see the stretched small image
replaced by the browser, this is how it'll work when the end-user has javascript
disabled. which is great it works without javascript, but we can provide a
better UX by adding our transition to the image.

> You might need to throttle your network speed in the dev tools to see the
> image switched out. Using 'Good 3G' or 'Regular 4G/LTE' presets should be
> enough to see the change happen.

✅ Step 2.

## Add a Transition

Now let's apply some JS to allow for a nice transition.

> This is pretty much taken straight from the Gatsby
> [source code](https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-remark-images/src/gatsby-browser.js)

```js
const imageWrappers = document.querySelectorAll(`.img-wrapper`);

for (let i = 0; i < imageWrappers.length; i++) {
	const imgWrap = imageWrappers[i];

	const imgEl = imgWrap.querySelector('img');

	const onImageComplete = () => {
		imgEl.style.opacity = 1;
		imgEl.style.filter = null;
		imgEl.style.color = `inherit`;
		imgEl.style.boxShadow = `inset 0 0 0 400px white`;
		imgEl.removeEventListener('load', onImageLoad);
		imgEl.removeEventListener('error', onImageComplete);
	};

	const onImageLoad = () => {
		imgEl.style.transition = `opacity .4s cubic-bezier(0.4, 0.0, 0.2, 1)`;

		onImageComplete();
	};

	imgEl.style.opacity = 0;
	imgEl.style.filter = `blur(50px)`;
	// make safari have crisp edges
	imgEl.style.transform = `scale(1)`;
	imgEl.addEventListener('load', onImageLoad);
	imgEl.addEventListener('error', onImageComplete);

	if (imgEl.complete) {
		onImageComplete();
	}
}
```

Walking through the code

1. We get all the image wrappers
1. Looping over and grabbing images from the wrapper
1. We set up two functions that alter the styles for the different states,
   `onLoad` and `onComplete`
1. We set some default stiles on the image
   - Applying a blur to smooth our small image a little
1. We check if the image already loaded, if so, we run our completion function.
1. Profit

That's pretty much it for sites not using Scully, there are a couple of gaps
you'll have to figure out if you're using a single page application such as
making sure the plain js blur up is ran for every route change. Otherwise, your
images will not have the transition animation unless the page is visited
directly each time. i.e. not via frontend routing.

✅ Step 3.

## Scully Time

> Even if you're not using Scully you might find it helpful, as the Scully
> plugin is where we turn the AST into actual markup.

First, we need to make sure [jsdom](https://npmjs.com/package/jsdom) is
installed. `npm i -D jsdom`

Let's make a placeholder function and register the plugin

```js
// blurUp.plugin.js

const { registerPlugin } = require('@scullyio/scully');
const { log, yellow } = require('@scullyio/scully/utils/log');

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const { newImgMarkUp } = require('./blurUp.healper.plugin');

/**
 * @param {string} html
 * @return {Promise<string>}
 */
const blurUp = async (html) => {
	// we'll be using this in a minute
	const dom = new JSDOM(html);

	return dom.serialize();
};

const validator = async (conf) => [];

registerPlugin('render', 'blurUp', blurUp, validator);
module.exports.blurUp = blurUp;
```

### Scully Config

Now head over to your Scully config file, it should be the root of your repo.

In the config file, we are going to register a new render plugin like so

```js
// scully.{your-site}.config.js

require('./plugins/blurUp.plugin.js'); // or where ever your plugin in stored

exports.config = {
	projectRoot: './src',
	projectName: 'your-site-com',
	outDir: './dist/static',
	routes: {
		// Make sure your paths are correct
		'/blog/:slug': {
			type: 'contentFolder',
			postRenderers: ['blurUp'], // blur up plugin goes here
			slug: {
				folder: './blog',
			},
		},
	},
};
```

Now we should be able to run a Scully build and nothing should break. If it
does, make sure your blur up plugin is registered correctly and returning the
passed in HTML.

### Parsing AST

Now let's parse the AST to give our pages our blur up effect. Back in our
`blurUp.plugin.js` file.

```js
// blurUp.config.js

const { registerPlugin } = require('@scullyio/scully');
const { log, yellow } = require('@scullyio/scully/utils/log');

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const { newImgMarkUp } = require('./blurUp.healper.plugin');

/**
 * @param {string} html
 * @return {Promise<string>}
 */
const blurUp = async (html) => {
	const dom = new JSDOM(html);
	const { window } = dom;
	const imgs = window.document.querySelectorAll('img');

	log(yellow(`found ${imgs.length} images`));
	for (let i = 0; i < imgs.length; i++) {
		const mediaUrl = imgs[i].src;
		// use a default if no alt is found
		const caption = imgs[i].alt || 'Media by Caleb Ukle';

		const markupAST = await newImgMarkUp(mediaUrl, caption);
		const span = window.document.createElement(markupAST.tagName);
		span.classList.add(markupAST.props.class);
		span.style = markupAST.props.style;

		markupAST.children.forEach((c) => {
			const el = window.document.createElement(c.tagName);
			el.classList.add(c.props.class);
			el.style = c.props.style;
			el.src = c.props.src;
			el.srcset = c.props.srcset;
			el.alt = c.props.alt;
			el.title = c.props.title;
			el.sizes = c.props.sizes;

			span.appendChild(el);
		});

		imgs[i].replaceWith(span);
	}

	return dom.serialize();
};

const validator = async (conf) => [];

registerPlugin('render', 'blurUp', blurUp, validator);
module.exports.blurUp = blurUp;
```

What we are doing here is parsing the html string scully passes in with JSDom.
This allows us to query and modify the DOM like we would in a browser.

1. Get all the image tags
1. Loop over the tags and run our newImageMarkup function from
   `blog.helper.plugin.js`
1. Set the properties returned from our AST
1. replace the old image tag with our new markup
1. Send the new HTML back to Scully

Alright we on the home stretch, the last part is moving our plain js event
listeners to an Angular directive.

✅ Step 4.

## Angular Time

First, let's start by making an angular directive. `ng g d your-module/blur-up`

Our blur up directive class will need

1. To implment the AfterViewChecked and OnDestroy interfaces
1. To have a private property to hold our event listeners
1. To inject Render2 and ElementRef

Your directive should look something like this

```ts
// blur-up.directive.ts

import {
	AfterViewChecked,
	Directive,
	ElementRef,
	OnDestroy,
	Renderer2,
} from '@angular/core';

@Directive({
	selector: '[appBlurUp]',
})
export class BlurUpDirective implements AfterViewChecked, OnDestroy {
	private listeners = [];

	constructor(private render: Renderer2, private el: ElementRef) {}

	ngAfterViewChecked(): void {
		// Attach event listeners
	}

	ngOnDestroy(): void {
		// Clean up logic
	}
}
```

Now in our ngAfterViewCheck method, we will add the following code

> We use ngAfterViewCheck, because we need to run when the Scully transfer state
> completes which can be anywhere after OnInit. AfterViewInit is not a guarantee
> for content to be there. This could change pending if Scully makes changes on
> how transfer state works.

```ts
// blur-up.directive.ts

  ngAfterViewChecked(): void {

    const imgs = this.el.nativeElement.querySelectorAll('.img-sharp');

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < imgs.length; i++) {
      const imgEl = imgs[i];

      const onImageComplete = () => {
        imgEl.style.opacity = 1;
        imgEl.style.filter = null;
        imgEl.style.color = 'inherit';
        imgEl.style.boxShadow = 'inset 0 0 0 400px white';

        // imgEl.removeEventListener('load', onImageLoad);
        // imgEl.removeEventListener('error', onImageComplete);
      };

      const onImageLoad = () => {
        imgEl.style.transition = 'opacity .4s cubic-bezier(0.4, 0.0, 0.2, 1)';

        onImageComplete();
      };

      imgEl.style.opacity = 0;
      imgEl.style.filter = 'blur(10px)';
      imgEl.style.transform = 'scale(1)';
      this.listeners.push(this.render.listen(imgEl, 'load', onImageLoad));
      this.listeners.push(this.render.listen(imgEl, 'error', onImageComplete));
      // imgEl.addEventListener('load', onImageLoad);
      // imgEl.addEventListener('error', onImageComplete);

      if (imgEl.complete) {
        onImageComplete();
      }
    }
  }
```

In our ngOnDestroy method, we'll need to remove our listeners

```ts
// blur-up.directive.ts

  ngOnDestroy(): void {
    this.listeners.forEach(remove => remove());
  }
```

Now to use in our page template.

```html
<!--your-template.component.html-->

<section class="post-content" appBlurUp>
	<scully-content></scully-content>
</section>
```

✅ Step 5.

You now have blur up images with your Scully, or other, site by using Sharp and
some good ol developer skills of reading other peoples source code. A truly
invaluable skill. Congrats! 🎉

## Parting Thoughts

While not as easy as just installing a package, building your own plugin is
pretty satisfying. There are still improvements to my implementation
specifically the need of fluid images. right now images are 100% of their
container, so if your images are small then the full size image could be
stretched and pixelated. I might revist this as the source for fluid images is
also in the gatsby repo, but for a v1 I am very happy with the outcome.

If you're looking for more Scully plugins, I have written plugins for

- Adding Links to header tags
- Updating [Algolia](https://www.algolia.com/) Search Indexes
- Adding [Firebase](https://firebase.google.com/) Firestore documents for each
  route

Check them out
[here](https://calebukle.com/blog/scully-plugins-for-algolia-search-and-html-header-tag-links)

Have a nice day 😀!
