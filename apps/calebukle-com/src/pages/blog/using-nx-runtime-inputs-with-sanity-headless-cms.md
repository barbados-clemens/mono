---
layout: '../../layouts/BlogPost.astro'
title: Teach Nx Cache About Remote Content
description: How to leverage Nx runtime hash inputs to include remote content into your build process.
author: Caleb Ukle
publish_date: 2022-09-05
img: https://cdn.doubleuideas.com/blog/nx-runtime-inputs/nx-runtime-inputs.png?auto=format
tags:
  - Nx
  - Sanity
  - Astro
  - Netlify
  - Blog
---

## Problem

I recently ran into an issue when rebuilding this very site [with Astro](https://astro.build), where I needed to [tell Nx](https://nx.dev) about my [remote content hosted in Sanity CMS](https://sanity.io).
This is because when running the build, Nx would have a cache hit even though the remote content changed causing the sites content to be stale. I could switch [using SSR with Astro](https://docs.astro.build/en/guides/server-side-rendering/), but I like the idea of [SSG sites](https://www.netlify.com/blog/2020/04/14/what-is-a-static-site-generator-and-3-ways-to-find-the-best-one/) and wanted to keep this site SSG if at all possible.
So how do I tell Nx about my remote content?

## Runtime Hash Inputs

With Nx, you can [define `inputs` for targets](https://nx.dev/reference/project-configuration#inputs-&-namedinputs) to inform Nx what you care about when running this target. One of those options is called [runtime hash inputs](https://nx.dev/concepts/how-caching-works#runtime-hash-inputs) which tell Nx to run a given command and use its output as a part of its hash calculations. Here is an example `build` target using a runtime input.

> Learn more about [other Nx input types](https://nx.dev/reference/project-configuration#inputs-&-namedinputs)

```json
{
	"build": {
		"executor": "nx:run-commands",
		"inputs": [
			{
				"runtime": "node some-script.js"
			}
		]
	}
}
```

Within `some-script.js` you can do whatever you want, then it's output will be used by Nx.
So for "_whatever you want_" part, you can query your remote content and `console.log` it to include it the targets run. So if it changes, Nx knows about it 🔥.

Here is a small snippet of what I did to make this work with my Sanity content.

```js
// allows for correct caching of remote sanity content.
const SanityClient = require('@sanity/client');
const { createHash } = require('crypto');

/**
 * @returns {Promise<{_updatedAt: string}[]>}
 */
async function getTimestaps() {
	const DB_CLIENT = new SanityClient({
		// ...snip
		useCdn: false, // make sure you skip the cdn
	});
	// query for the stuff you care about.
	// since _updateAt (builtin field) will change when content changes, we just need that field.
	const query = `*[_type == "<some-type>"]{_updatedAt}`;
	return await DB_CLIENT.fetch(query);
}

getTimestaps().then((results) => {
	const hash = createHash('sha256');
	for (const record of results) {
		hash.update(record._updatedAt);
	}
	// logging to stdout so Nx knows about it.
	console.log(hash.digest('hex'));
});
```

Toss that file in your workspace `tools` directory then add your runtime input to the desired target, `build` in my case.

Inputs won't get merged from the `nx.json`, so you'll need to move over anything from there for your build target, but you can reuse the `namedInputs` defined in the `nx.json` within your `project.json` file.

You could define the runtime input in the `nx.json`, but that would cause the runtime input to apply to all `build` targets, which you almost certainly don't want in a monorepo. So defining in the project specific `project.json` is the way to go.

You can see [the exact usage for my site here](https://github.com/barbados-clemens/mono/blob/main/apps/calebukle-com/project.json#L9-L15).

> Read more about [Nx configuration files](https://nx.dev/reference/project-configuration) or [nx.json](https://nx.dev/reference/nx-json)

## Deployments

Now that you've taught Nx how to be content aware for your site. You still need to redeploy the site when the content changes. Sanity offers webhook integrations where you can filter on specific content changes.
This means when your desired content changes, they'll ping whatever URL you want.

![Sanity webhook panel](https://cdn.doubleuideas.com/blog/nx-runtime-inputs/sanity-webhook.png?auto=format)

I use [Netlify](https://netlify.com) as my hosting provider, which has build hooks. This is a URL you can ping to tell Netlify you want to rebuild a given site.

![Netlify build hook panel](https://cdn.doubleuideas.com/blog/nx-runtime-inputs/netlify-build-hook.png)

So I can wire up Sanity to let Netlify know when content changes, and since Nx is content aware it will have a cache miss, building the site 🎉

![flowchart of full integration, sanity content changes -> netlify builds -> nx runs build -> if content changes run full build, otherwise pull from cache -> netlify publishes the changes](https://cdn.doubleuideas.com/blog/nx-runtime-inputs/flowchart-dark.webp?auto=format)
