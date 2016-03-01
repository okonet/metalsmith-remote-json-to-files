module.exports = function (wallaby) {
    return {
        debug: true,
        files: [
            'src/**/*.js',
            'test/**/*',
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
