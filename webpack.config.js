var webpack = require('webpack');

module.exports = {
  entry: './clientsrc/Application.jsx',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(js|jsx)$/,
        use: ['babel-loader'],
      },
    ],
  },
  output: {
    filename: 'bundle.js',
    path: __dirname + '/static',
    publicPath: '/',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
};
