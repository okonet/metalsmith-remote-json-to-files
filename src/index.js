/* eslint-disable no-param-reassign */

import 'babel-polyfill'
import 'isomorphic-fetch'
import util from 'util'
import chalk from 'chalk'
import debug from 'debug'
import { merge, template, isArray, isString } from 'lodash'

const DEBUG_KEY = 'metalsmith:remote-json-to-files' // See https://github.com/mahnunchik/metalsmith-debug
const log = debug(DEBUG_KEY)
const ok = chalk.green(`✔︎`)
const nok = chalk.red(`✗`)

function inspect(obj) {
    return `\n${ util.inspect(obj, { colors: debug.useColors() }) }`
}

const defaultFetchOptions = {
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
}

const defaultTransformOptions = {}

function transform(json, opts) {
    if (isArray(json)) {
        return json.reduce((prev, item) => {
            const compiled = Object.keys(opts).reduce((obj, key) => {
                const val = template(opts[key])(item)
                return {
                    ...obj,
                    [key]: key === 'contents' ? new Buffer(val) : val
                }
            }, {})
            return {
                ...prev,
                [compiled.filename]: { ...compiled }
            }
        }, {})
    }
    return {}
}

export default (fetchOptions = {}, transformOpts = {}) => {
    const { url, ...rest } = fetchOptions
    const fetchOpts = merge(defaultFetchOptions, rest)
    const transformOptions = merge(defaultTransformOptions, transformOpts)

    return async (files, metalsmith, done) => {

        // Check required options and parameters
        if (typeof url === 'undefined') {
            return done(new Error(`${nok} 'url' parameter must be specified`))
        }
        if (!isString(transformOptions.filename)) {
            return done(new Error(`${nok} 'filename' option is required and must be a string`))
        }
        if (!isString(transformOptions.contents)) {
            return done(new Error(`${nok} 'contents' option is required and must be a string`))
        }

        // Request JSON
        const json = await fetch(url, fetchOpts)
            .then(response => response.json())
            .catch(err => done(err))

        log(`${ok} Fetched from ${url}: `, inspect(json))

        // Transfor the result to files
        const newFiles = transform(json, transformOptions)

        // Add files to pipeline
        files = Object.assign(files, newFiles)
        log(`${ok} Transformed JSON to files: `, inspect(newFiles))
        done()
    }
}
