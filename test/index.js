import 'isomorphic-fetch'
import path from 'path'
import expect from 'expect'
import equal from 'assert-dir-equal'
import Metalsmith from 'metalsmith'
import fetchMock from 'fetch-mock'
//import fetch from 'node-fetch'
//import mockery from 'mockery'
import plugin from '../src'

//fetchMock.useNonGlobalFetch(fetch)

describe('Plugin basics', () => {

    const path = 'test/fixtures/basic'

    beforeEach(() => {
        fetchMock.mock('http://gihub.com', [{
            name: '1',
            body: 'test1\n'
        }, {
            name: '2',
            body: 'test2\n'
        }])
    })

    afterEach(() => {
        fetchMock.restore()
    })

    it('should not make a request without params', (done) => {
        new Metalsmith(path)
            .use(plugin())
            .build(err => {
                expect(err).toBeAn('object') // TODO: Investigate why error isn't an Error
                expect(fetchMock.calls().matched.length).toBe(0)
                expect(fetchMock.calls().unmatched.length).toBe(0)
                done()
            });
    })

    it('should make a request to a given URL', (done) => {
        new Metalsmith(path)
            .use(plugin({
                url: 'http://gihub.com'
            }))
            .build(err => {
                console.log(err)
                if (err) {
                    return done(err)
                }

                expect(fetchMock.calls().matched.length).toBe(1)
                expect(fetchMock.calls().unmatched.length).toBe(0)
                done()
            });
    })

    it('should call a callback with JSON as argument', (done) => {
        new Metalsmith(path)
            .use(plugin({
                url: 'http://gihub.com'
            }, (json) => {
                return json.reduce((prev, curr) => {
                    const key = curr.name + '.html'
                    const transformed = {}
                    transformed[key] = Object.assign({}, {
                        title: curr.name,
                        contents: new Buffer(curr.body)
                    })
                    return Object.assign(prev, transformed)
                }, {})
            }))
            .build(err => {
                if (err) {
                    return done(err)
                }

                equal(path + '/expected', path + '/build')
                done()
            });
    })
})
