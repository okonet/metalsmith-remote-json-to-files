/* eslint-disable no-param-reassign */
/* eslint-disable no-console */

import 'regenerator/runtime'
import 'isomorphic-fetch'
import util from 'util'
import chalk from 'chalk'
import debug from 'debug'

const DEBUG_KEY = 'metalsmith:remote-json-to-files' // See https://github.com/mahnunchik/metalsmith-debug
const log = debug(DEBUG_KEY)
const ok = chalk.green(`✔︎`)
const nok = chalk.red(`✗`)

function inspect(obj) {
    return `\n${ util.inspect(obj, { colors: debug.useColors() }) }`
}

export default (opts = {}, callback) => {
    const { url, fetchOpts } = opts

    return async (files, metalsmith, done) => {
        const json = await fetch(url, fetchOpts)
            .then(response => response.json())
            .catch(err => done(err))

        log(`${ok} Fetched from ${url}: `, inspect(json))

        if (typeof callback === 'function') {
            const newFiles = callback(json, files, metalsmith)
            files = Object.assign(files, newFiles)
            log(`${ok} Transformed JSON to files: `, inspect(newFiles))
            done()
        } else {
            log(`${nok} Could not find callback function`)
            done()
        }
    }
}
