const webpack = require('webpack')

const debug = process.env.NODE_ENV !== 'production';
const assetPrefix = !debug ? '/voting' : '';

module.exports = {
  assetPrefix: assetPrefix,
  exportPathMap: function () {
    return {
      '/': { page: '/' },
      '/stakeholder': { page: '/stakeholder' },
      '/guardian': { page: '/guardian' }
    }
  },
  webpack: config => {
    config.plugins.push(
      new webpack.DefinePlugin({
        'BASE_PATH': JSON.stringify(assetPrefix),
      }),
    )

    return config
  },
}