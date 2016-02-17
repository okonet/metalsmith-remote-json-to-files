/* eslint-disable no-param-reassign */
/* eslint-disable no-console */

import 'regenerator/runtime'
import fetch from 'node-fetch'

export default (opts = {}, callback) => {
    const { url, fetchOpts } = opts
    return async (files, metalsmith, done) => {
        const json = await fetch(url, fetchOpts)
            .then(response => response.json())
            .catch(err => console.log('parsing failed', err))

        if (typeof callback === 'function') {
            files = Object.assign(files, callback(json, files, metalsmith))
            done()
        } else {
            done()
        }
    }
}
