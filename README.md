# metalsmith-remote-json-to-files ![Build Status](https://travis-ci.org/okonet/metalsmith-remote-json-to-files.svg?branch=master)

Fetch JSON from remote URLs, transform and inject as files into metalsmith pipeline

## Installation

`npm install --save-dev metalsmith-remote-json-to-files`

## Usage

There are 2 ways of using this plugin:

* Simplified via configuration object
* Using a callback function

### Configuration object

Configuration object should include following keys:

* `url` — [String] URL to fetch from
* `transformOpts.filename` — [String] A string to interpolate the resulting filename from
* `transformOpts.contents` — [String] A string to interpolate the contents of the file from

So, if the endpoint in the `url` returns something like:

```json
[{
    "name": "item1",
    "body": "content1"
}, {
    "name": "item2",
    "body": "content2"
}]
```

the configuration object should look like:

```json
{
    "url": "URL",
    "transformOpts": {
        "filename": "${name}.html",
        "contents": "${body}"
    }
}
```

## Example

Generate static pages from GitHub [releases](https://github
.com/okonet/metalsmith-remote-json-to-files/releases) of this project.

### Using `metalsmith.json` 

```json
{
  "source": "src",
  "destination": "build",
  "plugins": {
    "metalsmith-remote-json-to-files": {
      "url": "https://api.github.com/repos/okonet/metalsmith-remote-json-to-files/releases",
      "transformOpts": {
        "filename": "${tag_name}.html",
        "contents": "${body}"
      }
    }
  }
}
```

This should generate a page for each release from this repository with the contents of the 
release.

### Using Node.js API

```js
const metalsmith = require('metalsmith')
const remote = require('metalsmith-remote-json-to-files')

metalsmith(__dirname)
    .use(remote({
        url: 'https://api.github.com/repos/okonet/metalsmith-remote-json-to-files/releases',
        "transformOpts": {
            filename: '${tag_name}.html',
            contents: '${body}'
        }
    }))
    .build(function(err) {
        if (err) throw err;
    })
```

### Advanced usage

If you have more advanced usa case, you can always opt-out for using a callback function. This function takes JSON Object as an argument and must return a metalsmith-compatible object with file descriptions. It should look like this:

```js
{
    filename1: {
        ...
        contents: ''
    }
}
```

Use callback function to transform or enchance your data. In the example below we'll use `metalsmith-collection` plugin to generate a changelog page.

```js
const metalsmith = require('metalsmith')
const remote = require('metalsmith-remote-json-to-files')
const markdown = require('metalsmith-markdownit')
const collections = require('metalsmith-collections')

function cb(json) {
    const formatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return json.reduce((prev, item) => {
        var versionNumber = item.tag_name.replace('v', '')
        const filename = `changelog/${ versionNumber }.md`
        return Object.assign(prev, {
            [filename]: {
                layout: 'page.html',
                collection: 'changelog',
                title: versionNumber,
                dateString: new Date(item.created_at).toLocaleDateString('en', formatOptions),
                date: new Date(item.created_at),
                contents: new Buffer(item.body)
            }
        })
    }, {})
}

metalsmith(__dirname)
    .use(remote({
        url: 'https://api.github.com/repos/okonet/metalsmith-remote-json-to-files/releases',
        transformOpts: cb
    }))
    .use(collections({
        changelog: {
            pattern: 'changelog/**/*.md',
            sortBy: 'date',
            reverse: true,
            refer: false
        }
    }))
    .use(markdown({
        html: true,
        typographer: true,
        linkify: true
    }))
    .build(function(err) {
        if (err) throw err;
    })
```

and then in `_pages/changelog/index.html`

```
---
layout: page.html
title: What’s New
slug: Changelog
permalink: /changelog/
---

<ul class="changelog">
    {{#each collections.changelog }}
    <li class="changelog__item">
        <time datetime="{{ date }}" class="changelog__date">{{ dateString }}</time>
        <div class="changelog__content">
            <h2 class="changelog__title">{{ title }}</h2>
            <section class="changelog__body">{{{ contents }}}</section>
        </div>
    </li>
    {{/each }}
</ul>

```

