---
layout: '../../layouts/BlogPost.astro'
title: Generate Code Coverage Badge with Gitlab CI and an Angular Project
description: As the title says, this is how to enable the code coverage badge with Angular on Gitlab CI. Also, I’ll show setting up a Gitlab pipeline for testing an Angular application at the end.
author: Caleb Ukle
publish_date: 2018-07-23

img: /blog/ng-gitlab-code-coverage/coverage-output.png
tags:
  - Angular
  - Gitlab
  - Continuous Integration
  - Blog
---

> _This post originally appeared on
> [Medium on July 23, 2018](https://medium.com/@caleb.ukle/code-coverage-badge-with-angular-karma-istanbul-on-gitlab-ci-9611b69ad7e)._

![Pipeline and Code Coverage status badges.](/blog/ng-gitlab-code-coverage/badges.png)

## Update Karma Config

Angular uses Istanbul and Karma for built-in testing. So the first thing is to
update the karma.conf.js file, specifically the code block titled
coverageIstanbulReporter. In here, you’ll want to add text-summary to the
reports array. [More options for Karma](https://github.com/mattlewis92/karma-coverage-istanbul-reporter#list-of-reporters-and-options).

```js
coverageIstanbulReporter:{
  dir: require("path").join(__dirname, "coverage"),
  reports: ["html" "lcovonly", "text-summary"], // <- Right Here
  fixWebpackSourcePaths: true
},
```

Now when you run `ng test --watch=false --code-coverage` you will get a text
summary in the console about your code coverage now. Hurrah!

![terminal output showing code coverage](/blog/ng-gitlab-code-coverage/coverage-output.png)

Alright, so now your project is configured to display the code coverage in the
console. This is an important step because Gitlab uses Ruby Regular Expressions
to capture the output of the pipeline console. No console output means no code
coverage badge.

## Update Gitlab Pipeline

Next, head over to [Gitlab.com](https://gitlab.com) and head to _your project >
Settings > CI/CD > General pipelines_. Scroll down until you see **Testing
coverage parsing**. In here, you’ll want to include this regular expression.
(Thanks to
[this Stack Overflow post](https://stackoverflow.com/questions/39658439/how-do-i-extract-test-coverage-from-the-istanbul-text-summary-reporter-with-a-re)
for the Regular Expression).

```regex
Statements.*?(\d+(?:\.\d+)?)%
```

Alright! So now that will give you the percentage of code coverage for
Statements. If you’d like a different part of the code coverage, then switch out
_Statements_ for a different code coverage word (Branches, Functions, or Lines).

## Grab Badge Markup

We are on the home stretch now. Scroll down a little more past the **General
pipelines** section we’ve been working in. You’ll come across to two badges,
**Pipeline status**, and **Coverage report**. Before you just copy over the
markup, make sure you use the drop-down in the top right to select the branch
you’d like the statuses to come from. Once you have the correct branch just copy
and paste it to wherever your heart desires. _i.e. README.md._ That’s it! Next
time you run your pipeline Gitlab will capture the output and update the badge
with the code coverage percentage!

## Gitlab CI Config Example

As promised, I’ll talk a little about setting up a Gitlab pipeline for testing
Angular applications. Right up front here is my `.gitlab-ci.yml`

```yaml
cache:
  paths: node_modules/
before_script: yarn global add @angular/cli
  yarn install
testing:
  image: trion/ng-cli-karma
  stage: test
  environment: test
  script: ng test -watch=false --code-coverage
    echo running end to end testing
    ng e2e
  artifacts:
    paths: coverage/

pages:
  image: alpine
  stage: deploy
  dependencies: testing
  before_script: echo 'deploying code coverage stats'
  script: mv coverage/ public/
  artifacts:
    paths: public
  expire_in: 30 days

bundle_stage:
  image: node
  stage: build
  environment: build
  only: master
  script: ng build -prod --output-path=public
  # deploy somewhere
```

The trick for me was figuring out how to run the tests in a docker container.
Because if you try running in just a node:latest container, it won’t work since
Karma is looking for Chrome. Luckily someone has already done the hard work in
solving that problem. A huge shout out to
[this docker container](https://hub.docker.com/r/trion/ng-cli-karma/) and its
maintainer. So with that piece of the puzzle you’re able to run
`ng test --watch=false` and `ng e2e` without issues.

The eagle-eyed reader will notice a _Pages_ build step. I am using
[Gitlab Pages](https://about.gitlab.com/features/pages/) to host the HTML output
of [my code coverage](https://caleb-ukle.gitlab.io/shop-the-fridge/). It’s very
easy and simple to do. You can follow along with the build steps.

- Use Alpine Docker Image

- Override global before_scripts

- Move the coverage/ to public/ directory

- Create a build artifact of the public/ directory

1. something
1. another
1. for sure
   1. anc

The reason for the Alpine image is it’s so small; therefore, fewer pipeline
minutes are spent downloading larger images. All we need to do is move one
directory to another. The coverage/ directory is a build artifact from the
testing job. Since there’s a dependency in the pages job, the pages job will
wait until testing is finished before starting. Finally, creating a build
artifact of the public/ directory tells Gitlab to use this as a Gitlab Page,
auto-magically.

That’s all there is to testing Angular applications in a Gitlab pipeline. More
[info about Gitlab CI/CD can be found
here](https://about.gitlab.com/features/gitlab-ci-cd/).

---

_Post Updates:_

- _2019–04–05: Updated grammar and spelling_
- _2019-09-1: Moved to personal blog site_
