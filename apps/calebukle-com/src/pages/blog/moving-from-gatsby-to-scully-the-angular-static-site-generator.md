---
layout: '../../layouts/BlogPost.astro'
title: Moving From Gatsby to Scully (The Angular Static Site Generator)
description: When originally building this site, I used Gatsby. But with the release of Scully, I jumped ship so I can use my favorite web framework, Angular instead of React.
author: Caleb Ukle
publish_date: 2020-02-16
img: 'https://cdn.doubleuideas.com/blog/gatsby-to-scully/scullyio-logo.png?auto=format'
tags:
  - Angular
  - Gatsby
  - Scully
  - Static Site Generator
  - Blog
---

> Scully is in a alpha version at the time of writing this. So things are likely
> to change. I will update this post if anything changes in a beta/v1 release.

If you're reading this that means I have finally moved this site from Gatsby to
Scully! 🎉

## What are you talking about?

Well, this website was originally build using GatsbyJS, a React static site
generator. Personally, I prefer Angular, a web framework made by Google. So you
guessed it. Scully is built on Angular.

This post isn't going to be a detailed analysis but more of my thoughts behind
the move and the different platforms

## Overview

_So why did I jump ship to a less user-friendly, beta version of a framework
when things were working just fine?_ - Probably you

Well, I didn't know much about React and it didn't really gel with how I like to
develop. I didn't understand a lot of what was happening either. With Scully
being so new and not as abstracted, I have a much better understanding and
control over my site.

## Pros

So the biggest pro to switching was the comfortability being in Angular vs
React. I can work faster and write better code in Angular than React. I felt
like I was just copying and pasting from docs when trying to get things working
for React.

Another is the way you build projects, React doesn't really have a set way of
structuring and building apps, it's very unopinionated. For me, I prefer the
opinionated ways of Angular. Mainly about Angular services. In React, I'm not
sure how you're supposed to perform dependency injection. I ended up writing a
lot of logic in the view layer itself which is just a recipe for disaster. This
is not a slam of React, just the fact I haven't spent enough time to know how to
property architect apps in that framework.

## Cons

A major con to the switch is the lack of plugins and the community. At the
current moment, Scully has just reached beta and there's only a handful of
plugins. I had to write all the plugins by hand for all the things I was using
in Gatsby, such as linked headers and Algolia search. I have high hopes the
plugin ecosystem and community will grow around this project like what happened
with Gatsby. In the meantime, I have to handroll all my own plugins.

Another con is development workflow is not as simple as gatsby. right now in
order to build your Scully app, you have to run an angular build `ng build`,
then a scully build `scully`, and finally serve the content, `scully serve`. If
a change is made then you have to start over, there are watch commands,
`ng build --watch` and `scully watch`, but I get an infinite loop of builds with
both running. 🤷‍♀️ not sure what the issue is there. I plan on making a sample
repo and reporting my issue if I can't figure it out by then.

## Parting Thoughts

End of the day I am happy with the move mainly because I can get more work done
in Angular (Scully) than I can in React (Gatsby)

Some features I'd like to see in Scully would be the ability to emit some events
from the `<scully-content></scully-content>` such as content loaded so I can
perform events correctly, better documentation (it's a beta, it'll get better I
know), a better dev workflow. more community participation.

You can view the entire source code for this site
[here](https://gitlab.com/caleb-ukle/portfolio)

Want to learn about the custom plugins I made for Scully? Check out my post
[here](/blog/scully-plugins-for-algolia-search-and-html-header-tag-links)
