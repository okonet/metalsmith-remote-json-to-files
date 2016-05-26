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

Generate static pages from GitHub releases for this project.

### Using `metalsmith.json` 

```json
{
  "source": "src",
  "destination": "build",
  "plugins": {
    "metalsmith-remote-json-to-files": {
      "url": "https://api.github.com/repos/okonet/metalsmith-remote-json-to-files/releases",
      "transformOpts": {
        "filename": "${name}.html",
        "contents": "${body}"
      }
    }
  }
}
```

This should generate a page for each release from this repository with the contents of the 
release. Visit https://github.com/okonet/metalsmith-remote-json-to-files/releases to compare.
 
Same results can be aichived using Node.js API

```js
const metalsmith = require('metalsmith')
const remote = require('metalsmith-remote-json-to-files')

metalsmith(__dirname)
    .use(remote({
        url: 'https://api.github.com/repos/okonet/metalsmith-remote-json-to-files/releases',
        "transformOpts": {
            filename: '${name}.html',
            contents: '${body}'
        }
    }))
    .build(function(err) {
        if (err) throw err;
    })
```

If you have more advanced usa case, you can always opt-out for using a callback function. This 
function must return an array of objects with at least `filename` and `contents` keys set. But 
you can add whatever you want to it and when combine with different metalsmith plugins. 
