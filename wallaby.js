module.exports = function (wallaby) {
    return {
        debug: true,
        files: [
            'src/**/*.js',
            { pattern: 'test/fixtures/**/*', instrument: true, load: false },
            { pattern: 'test/**/*.js', ignore: true }
        ],

        tests: [
            'test/**/*.js'
        ],

        compilers: {
            '**/*.js': wallaby.compilers.babel()
        },

        env: {
            type: 'node'
        }
    }
}
