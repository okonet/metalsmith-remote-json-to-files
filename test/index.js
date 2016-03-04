import 'isomorphic-fetch'
import path from 'path'
import expect from 'expect'
import equal from 'assert-dir-equal'
import fetchMock from 'fetch-mock'
import Metalsmith from 'metalsmith'

const plugin = require(process.env.NODE_ENV === 'test' ? '../lib' : '../src')

describe('metalsmith-remote-json-to-files', () => {

    afterEach(() => {
        fetchMock.restore()
    })

    describe('Plugin basics', () => {
        beforeEach(() => {
            fetchMock.mock('http://myurl.test', 200)
        })

        it(`should throw before requesting data if no url was specified`, (done) => {
            new Metalsmith('.')
                .use(plugin())
                .build(err => {
                    expect(err.toString()).toInclude(`'url' parameter must be specified`)
                    expect(fetchMock.calls().matched.length).toBe(0)
                    expect(fetchMock.calls().unmatched.length).toBe(0)
                    done()
                })
        })

        it(`should throw if filename option is not defined`, (done) => {
            new Metalsmith('.')
                .use(plugin({
                    url: 'http://myurl.test'
                }))
                .build(err => {
                    expect(err.toString())
                        .toInclude(`'filename' option is required and must be a string`)
                    done()
                })
        })

        it(`should throw if filename option is not a string`, (done) => {
            new Metalsmith('.')
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: true
                }))
                .build(err => {
                    expect(err.toString())
                        .toInclude(`'filename' option is required and must be a string`)
                    done()
                })
        })

        it(`should throw if contents option is not defined`, (done) => {
            new Metalsmith('.')
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: ''
                }))
                .build(err => {
                    expect(err.toString())
                        .toInclude(`'contents' option is required and must be a string`)
                    done()
                })
        })

        it(`should throw if contents option is not a string`, (done) => {
            new Metalsmith('.')
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: '',
                    contents: 1
                }))
                .build(err => {
                    expect(err.toString())
                        .toInclude(`'contents' option is required and must be a string`)
                    done()
                })
        })

        it('should make a request to a given URL', (done) => {
            new Metalsmith('.')
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: '',
                    contents: ''
                }))
                .build(() => {
                    expect(fetchMock.calls().matched.length).toBe(1)
                    expect(fetchMock.calls().unmatched.length).toBe(0)
                    done()
                })
        })

        it('should fetch with default options', (done) => {
            new Metalsmith('.')
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: '',
                    contents: ''
                }))
                .build(() => {
                    expect(fetchMock.lastOptions()).toEqual({
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json'
                        }
                    })
                    done()
                })
        })

        it('should merge options', (done) => {
            new Metalsmith('.')
                .use(plugin({
                    url: 'http://myurl.test',
                    headers: {
                        'x-test': 'foo'
                    },
                    test: 1
                }, {
                    filename: '',
                    contents: ''
                }))
                .build(() => {
                    expect(fetchMock.lastOptions()).toEqual({
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                            'x-test': 'foo'
                        },
                        test: 1
                    })
                    done()
                })
        })
    })

    describe('Adding files to the pipeline', () => {

        const fixtureData = [{
            name: '1',
            body: 'test1'
        }, {
            name: '2',
            body: 'test2'
        }]

        it('should interpolate filename and body and add files to a pipeline', (done) => {
            const fixturesPath = 'test/fixtures/basic'
            fetchMock.mock('http://myurl.test', fixtureData)

            new Metalsmith(fixturesPath)
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: '${name}.html',
                    contents: 'Wrapped ${body} content\n'
                }))
                .build(err => {
                    expect(err).toBe(null)
                    equal(path.join(fixturesPath, 'expected'), path.join(fixturesPath, 'build'))
                    done()
                })
        })

        it('should interpolate filenames but use ' +
            'static for body before adding to a pipeline', (done) => {
            const fixturesPath = 'test/fixtures/filename-interpolate'
            fetchMock.mock('http://myurl.test', fixtureData)

            new Metalsmith(fixturesPath)
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: 'interpolated-${name}.md',
                    contents: 'static\n'
                }))
                .build(err => {
                    expect(err).toBe(null)
                    equal(path.join(fixturesPath, 'expected'), path.join(fixturesPath, 'build'))
                    done()
                })
        })

        it('should not change the pipeline for empty JSON reposponse', (done) => {
            const fixturesPath = 'test/fixtures/no-run'
            fetchMock.mock('http://myurl.test', [])

            new Metalsmith(fixturesPath)
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: '${name}.md',
                    contents: 'static\n'
                }))
                .build(err => {
                    expect(err).toBe(null)
                    equal(path.join(fixturesPath, 'expected'), path.join(fixturesPath, 'build'))
                    done()
                })
        })

        it('should not change the pipeline for empty JSON reposponse', (done) => {
            const fixturesPath = 'test/fixtures/no-run'
            fetchMock.mock('http://myurl.test', {})

            new Metalsmith(fixturesPath)
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: '${name}.md',
                    contents: 'static\n'
                }))
                .build(err => {
                    expect(err).toBe(null)
                    equal(path.join(fixturesPath, 'expected'), path.join(fixturesPath, 'build'))
                    done()
                })
        })

        it('should stop build with error for errored reposponses', (done) => {
            const fixturesPath = 'test/fixtures/no-run'
            fetchMock.mock('http://myurl.test', 404)

            new Metalsmith(fixturesPath)
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: '${name}.md',
                    contents: 'static\n'
                }))
                .build(err => {
                    expect(err).toNotBe(null)
                    done()
                })
        })

        it('should overwrite existing files in the pipeline', (done) => {
            const fixturesPath = 'test/fixtures/overwrite'
            fetchMock.mock('http://myurl.test', fixtureData)

            new Metalsmith(fixturesPath)
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: '${name}.html',
                    contents: 'overwritten\n'
                }))
                .build(err => {
                    expect(err).toBe(null)
                    equal(path.join(fixturesPath, 'expected'), path.join(fixturesPath, 'build'))
                    done()
                })

        })

        it('should inject all properties to files', (done) => {
            const fixturesPath = 'test/fixtures/basic'
            fetchMock.mock('http://myurl.test', fixtureData)

            new Metalsmith(fixturesPath)
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: '${name}.html',
                    title: 'Title ${name}',
                    foo: 'bar',
                    contents: 'Wrapped ${body} content\n'
                }))
                .use((files) => {
                    expect(Object.keys(files).length).toBe(3)
                    expect(files['1.html'].title).toEqual('Title 1')
                    expect(files['2.html'].title).toEqual('Title 2')
                    expect(files['1.html'].foo).toEqual('bar')
                    expect(files['2.html'].foo).toEqual('bar')
                })
                .build(err => {
                    expect(err).toBe(null)
                    equal(path.join(fixturesPath, 'expected'), path.join(fixturesPath, 'build'))
                    done()
                })
        })

        it('should support callback function', (done) => {
            const fixturesPath = 'test/fixtures/basic'
            fetchMock.mock('http://myurl.test', fixtureData)

            function cb(json, files, metalsmith) {
                expect(json).toBeAn('array')
                expect(files).toBeAn('object')
                expect(metalsmith).toExist()

                return json.reduce((res, item) => {
                    const filename = `${ item.name }.html`
                    return {
                        ...res,
                        [filename]: {
                            string: `Title ${item.name}`,
                            date: new Date(parseInt(item.name, 10)),
                            contents: new Buffer(`Wrapped ${item.body} content\n`),
                            number: 1,
                            bool: true,
                            func: () => null
                        }
                    }
                }, {})
            }

            new Metalsmith(fixturesPath)
                .use(plugin({
                    url: 'http://myurl.test'
                }, cb))
                .use((files) => {
                    expect(files['1.html'].string).toBeA('string')
                    expect(files['1.html'].string).toEqual('Title 1')

                    expect(files['1.html'].number).toBeA('number')
                    expect(files['1.html'].number).toEqual(1)

                    expect(files['1.html'].bool).toBeA('boolean')
                    expect(files['1.html'].bool).toEqual(true)

                    expect(files['1.html'].func).toBeA('function')

                    expect(files['1.html'].date).toBeA(Date)
                    expect(files['1.html'].date.getTime()).toEqual(1)
                })
                .build(err => {
                    expect(err).toBe(null)
                    equal(path.join(fixturesPath, 'expected'), path.join(fixturesPath, 'build'))
                    done()
                })
        })

        it.skip('should iterate over deeply nested props of JSON', (done) => {
            const fixturesPath = 'test/fixtures/no-array'
            fetchMock.mock('http://myurl.test', {
                foo: {
                    bar: [{
                        name: '1',
                        body: 'test1'
                    }, {
                        name: '2',
                        body: 'test2'
                    }]
                }
            })

            new Metalsmith(fixturesPath)
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    items: '${foo.bar}',
                    filename: '${foo}.md',
                    contents: '${bar}\n'
                }))
                .build(err => {
                    expect(err).toBe(null)
                    equal(path.join(fixturesPath, 'expected'), path.join(fixturesPath, 'build'))
                    done()
                })
        })

        it.skip('should work with a single item object returned in JSON', (done) => {
            const fixturesPath = 'test/fixtures/no-array'
            fetchMock.mock('http://myurl.test', {
                foo: 'single',
                bar: 'test content'
            })

            new Metalsmith(fixturesPath)
                .use(plugin({
                    url: 'http://myurl.test'
                }, {
                    filename: '${foo}.md',
                    contents: '${bar}\n'
                }))
                .build(err => {
                    expect(err).toBe(null)
                    equal(path.join(fixturesPath, 'expected'), path.join(fixturesPath, 'build'))
                    done()
                })
        })
    })
})
