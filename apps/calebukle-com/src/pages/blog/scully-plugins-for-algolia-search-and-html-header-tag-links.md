---
layout: '../../layouts/BlogPost.astro'
title: Scully Plugins for Algolia Search and HTML Header Tag Links and More!
description: While converting this blog over to Scully, I ended up writing plugins for updating an Algoia index and providing links to header locations, and a some other helpful ones. Check them all out here!
author: Caleb Ukle
publish_date: 2020-02-16
img: 'https://s3.amazonaws.com/media.calebukle.com/uploads/scullyio-logo.png'
tags:
  - Scully
  - Algoila
  - Firebase
  - Plugins
  - Blog
---

> Disclaimer: At the time of writing this
> [scully](https://github.com/scullyio/scully) is in a Alpha period. So things
> are likely to change. I will provide any updates once a beta/v1 release is
> made if needed.

If you want to learn more about the move from Gatsby to Scully or want to know
what scully even is check out my post
[here](https://calebukle.com/blog/moving-from-gatsby-to-scully-the-angular-static-site-generator).

> I just added a new plugin. Blur Up Images! You can learn more
> [here](https://calebukle.com/blog/blur-up-fade-in-images-without-gatsby-a-scully-plugin)

First thing to note before getting into the plugins, each plugin has to be
registered with a validator function. For all these plugins the validator wasn't
needed so an empty array in return. I show all the registration and usage for
each plugin. That is what the last couple lines per plugin is about.

## Plugin Overview

Jump to each plugins location for what you need

- [Adding Links](/blog/scully-plugins-for-algolia-search-and-html-header-tag-links#adding-links)
- [Algolia Search](/blog/scully-plugins-for-algolia-search-and-html-header-tag-links#algolia-search)
- [Firebase Firestore](/blog/scully-plugins-for-algolia-search-and-html-header-tag-links#firebase-firestore)
- [Using Plugins](/blog/scully-plugins-for-algolia-search-and-html-header-tag-links#using-plugins)

## Adding Links

> This plugin requires jsdom, `npm i -D jsdom`

I like the ability to directly link to a section of an article , and I wanted to
keep that functionality for my site. With scully being so new I couldn't find a
plugin that already did this work for me. So below you'll find the code that
adds the hash/pound/number/octothorpe or whatever your preferred name the
icon/symbol you see next to all the headers on this site.

```typescript
/* addLinksToHeader.plugin.ts */

const { registerPlugin } = require('@scullyio/scully');
const {
	log,
	yellow,
	green,
	red,
	logError,
} = require('@scullyio/scully/utils/log');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

/**
 * @param html {string}
 * @param route { {route: string}}
 * @returns {Promise<string>}
 */
const addLinksToHeader = async (html, route) => {
	try {
		// Create dom from the HTML string so we can query it for all headers
		const dom = new JSDOM(html);
		const { window } = dom;

		const headers = window.document.querySelectorAll(`h1, h2, h3, h4, h5`);

		// Loop over all headers and add the link
		headers.forEach((h) => {
			if (!!h.id) {
				const link = window.document.createElement(`a`);

				// add whatever svg icon you want here
				link.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M440.667 182.109l7.143-40c1.313-7.355-4.342-14.109-11.813-14.109h-74.81l14.623-81.891C377.123 38.754 371.468 32 363.997 32h-40.632a12 12 0 0 0-11.813 9.891L296.175 128H197.54l14.623-81.891C213.477 38.754 207.822 32 200.35 32h-40.632a12 12 0 0 0-11.813 9.891L132.528 128H53.432a12 12 0 0 0-11.813 9.891l-7.143 40C33.163 185.246 38.818 192 46.289 192h74.81L98.242 320H19.146a12 12 0 0 0-11.813 9.891l-7.143 40C-1.123 377.246 4.532 384 12.003 384h74.81L72.19 465.891C70.877 473.246 76.532 480 84.003 480h40.632a12 12 0 0 0 11.813-9.891L151.826 384h98.634l-14.623 81.891C234.523 473.246 240.178 480 247.65 480h40.632a12 12 0 0 0 11.813-9.891L315.472 384h79.096a12 12 0 0 0 11.813-9.891l7.143-40c1.313-7.355-4.342-14.109-11.813-14.109h-74.81l22.857-128h79.096a12 12 0 0 0 11.813-9.891zM261.889 320h-98.634l22.857-128h98.634l-22.857 128z"/></svg>`;
				link.href = `${route.route}#${h.id}`;
				link.title = `Link to this point`;

				// custom class for styling
				link.classList.add(`header-link`);
				h.appendChild(link);
			}
		});

		log(green(`Added heading links for ${route.route}`));
		return dom.serialize();
	} catch (e) {
		logError(
			`${red('Issue creating header links for')} ${yellow(route.route)}`
		);
	}
	return html;
};

const validator = async (conf) => [];
registerPlugin('render', 'addLinksToHeader', addLinksToHeader, validator);

module.exports.addLinkToHeader = addLinksToHeader;
```

## Algolia Search

> This plugin requires algolia search, `npm i algoliasearch`

Another feature I needed is the ability to update the sites search index when a
new post is created. I use
[Algolia](https://www.algolia.com/?utm_source=instantsearch-js&utm_medium=website&utm_content=calebukle.com&utm_campaign=customlink)
to power my searching needs. I highly recommend the service and they have a
generous free tier.

This plugin is about updating your algolia post index, if you want to see the
how I implemented search you can check out the source code
[here](https://gitlab.com/caleb-ukle/portfolio/-/tree/release/src/app/blog/components/search)

A lot of the code for this was ripped straight from the algolia gatsby plugin
source code, found
[here](https://github.com/algolia/gatsby-plugin-algolia/blob/master/gatsby-node.js)

```typescript
/* updateAlgoliaIndex.plugin.js */

const { registerPlugin } = require('@scullyio/scully');
const {
	log,
	yellow,
	green,
	red,
	logError,
} = require('@scullyio/scully/utils/log');
const algoliasearch = require('algoliasearch');

const SETTINGS = { attributesToSnippet: [`excerpt: 20`] };

const INDEX_NAME = `Blog_Posts`; // set your index name here

/**
 * @param html
 * @param options {
 * route: string;
 * data: {}
 * @returns {Promise<string>}
 */
const updateAlgoliaIndex = async (html, options) => {
	try {
		const client = initAlgoliaClient();
		const payload = buildPayload(options);

		const index = client.initIndex(INDEX_NAME);
		const mainIndexExists = await indexExists(index);
		// you can use a temp index and then copy that into your main index. I don't do this
		// check the gatsby plugin to see how it's used https://github.com/algolia/gatsby-plugin-algolia/
		const tmpIndex = client.initIndex(`${INDEX_NAME}_tmp`);
		const indexToUse = index; // mainIndexExits ? index : tmpIndex

		log(`Using [${indexToUse.indexName}]`);

		// if (mainIndexExists) {
		//   log(`copying existing index`)
		//   await scopedCopyIndex(client, index, tmpIndex)
		// }

		// Save Items in your index
		const { taskID } = await indexToUse.saveObject(payload);
		await indexToUse.waitTask(taskID);

		if (SETTINGS) {
			const { taskID } = await indexToUse.setSettings(SETTINGS);
			await indexToUse.waitTask(taskID);
		}
		//
		// if (mainIndexExists) {
		//   log(`moving copied index to main index`)
		//   await moveIndex(client, tmpIndex, index)
		// }

		log(green(`Updated index for [${payload.title}]`));
	} catch (e) {
		logError(red(JSON.stringify(e, null, 2)));
	}

	return html;
};

function initAlgoliaClient() {
	let isError = false;
	// Make sure you have these in your env variables
	// I use dotenv
	const appId = process.env.ALGOLIA_APP_ID;
	const apiKey = process.env.ALGOLIA_ADMIN_KEY;
	if (!appId) {
		logError(red(`ALGOLIA_APP_ID not found in environment variables!`));
		isError = true;
	}
	if (!apiKey) {
		logError(red(`ALGOLIA_ADMIN_KEY not found in environment variables!`));
		isError = true;
	}
	if (isError) {
		throw 'Make sure environment variables are set';
	}

	return algoliasearch(appId, apiKey);
}

/**
 * @param options
 * @returns {{date: *, path: *, description: *, title: *, objectID: number, tags: *[]}}
 */
function buildPayload(options) {
	// prevent leakage into other blog posts index payload
	const crypto = require('crypto');
	const hash = crypto.createHash('sha256');
	const { data, route } = options;
	hash.update(data.title, 'utf8');
	return {
		title: data.title,
		description: data.description,
		tags: [...data.tags],
		path: route,
		date: data.date,
		// Build an object Id with a hash from our project title
		objectID: parseInt(hash.digest('hex').slice(0, 15), 16),
		createIfNotExists: true,
	};
}

/**
 * Does an Algolia index exist already
 *
 * @param index
 */
async function indexExists(index) {
	try {
		const { nbHits } = await index.search();
		return nbHits > 0;
	} catch (e) {
		return false;
	}
}

/**
 * Copy the settings, synonyms, and rules of the source index to the target index
 * @param client
 * @param sourceIndex
 * @param targetIndex
 * @return {Promise}
 */
async function scopedCopyIndex(client, sourceIndex, targetIndex) {
	const { taskID } = await client.copyIndex(
		sourceIndex.indexName,
		targetIndex.indexName,
		{
			scope: ['settings', 'synonyms', 'rules'],
		}
	);
	return targetIndex.waitTask(taskID);
}

/**
 * moves the source index to the target index
 * @param client
 * @param sourceIndex
 * @param targetIndex
 * @return {Promise}
 */
async function moveIndex(client, sourceIndex, targetIndex) {
	const { taskID } = await client.moveIndex(
		sourceIndex.indexName,
		targetIndex.indexName
	);
	return targetIndex.waitTask(taskID);
}

const validator = async (conf) => [];
registerPlugin('render', 'updateAlgoliaIndex', updateAlgoliaIndex, validator);

module.exports.updateAlgoliaIndex = updateAlgoliaIndex;
```

A specific thing to note about the algolia search plugin, each objectId is a
hash of the blog post title. If you change the title of the post, you'll get a
new item in your index. You'll need to manually delete the old item from the
algolia web console. Otherwise, you'll have multiple items pointing to the same
place,

## Firebase Firestore

> This plugin requires the firebase admin sdk, `npm i -D firebase-admin`

I also save the posts in Firestore which powers the like/heart/favorite feature
you see on these posts.

```typescript
/* addPostToFirebase.plugin.ts */

const { registerPlugin } = require('@scullyio/scully');
const { log, logError, red, green } = require('@scullyio/scully/utils/log');
const admin = require('firebase-admin');
// service account json you can download from the firebase console.
// Make sure to save it all as one line in your .env file
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: '', // Add you're database url here
});
const db = admin.firestore();

const addPostToFirebase = async (html, route) => {
	try {
		// Add to Firestore based on route of blog
		await db.doc(`${route.route}`).set(route, { merge: true });
		log(green(`Added ${route.route} to Firebase`));
	} catch (e) {
		logError(red(`Issue adding ${route.route} to Firebase`));
		logError(red(JSON.stringify(e, null, 2)));
	}

	return html;
};

const validator = async (conf) => [];

registerPlugin('render', 'addPostToFirebase', addPostToFirebase, validator);

module.exports.addPostToFirebase = addPostToFirebase;
```

## Using Plugins

Now that you have these plugins defined. We need to tell scully to use them. All
of the plugins shown are _render_ plugins. There are other plugins such as
_router_ or _fileHandler_

```typescript
/* scully.{your-project}.config.js */
// Set env variables
require('dotenv').config();

// import plugins
require('./plugins/addLinksToHeader.plugin.ts');
require('./plugins/updateAlgoliaIndex.plugin.js');
require('./plugins/addPostToFirebase.plugin.ts');
exports.config = {
	projectRoot: './src',
	projectName: 'calebukle-com',
	outDir: './dist/static',
	routes: {
		'/blog/:slug': {
			type: 'contentFolder',
			// Render plugins go here. Should match the export name
			postRenderers: [
				'addLinksToHeader',
				'updateAlgoliaIndex',
				'addPostToFirebase',
			],
			slug: {
				folder: './blog',
			},
		},
	},
};
```

I hope that helps you with making your own custom Scully plugins. If you want
more information about Scully plugins, you can check out the official docs
[here](https://github.com/scullyio/scully/blob/master/docs/plugins.md) and you
can find some examples of plugins
[here](https://github.com/scullyio/scully/tree/master/extraPlugin).

If you want to know more about my thoughts on Scully then check out this post
[here](/blog/moving-from-gatsby-to-scully-the-angular-static-site-generator).

Thanks for reading!
