const path = require('path');

module.exports = {
    devServer: {
        proxy: 'http://localhost:3000'
    },

    pluginOptions: {
      'style-resources-loader': {
        preProcessor: 'scss',
        patterns: [
            path.resolve(__dirname, 'src/styles/*.scss'),
            path.resolve(__dirname, 'node_modules/bootstrap/scss/bootstrap.scss'),
        ]
      }
    }
}
