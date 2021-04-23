module.exports = function (api) {
  const babelEnv = api.env();
  api.cache(true);

  const presets = [
    [
      '@babel/preset-env',
      {
        targets: {
          chrome: 58,
        },
        corejs: '3.0.0',
        useBuiltIns: 'usage',
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ];
  const plugins = [
    [
      'import',
      {
        libraryName: 'antd',
        style: true,
      },
    ],
    'react-hot-loader/babel',
    // Stage 2 https://github.com/babel/babel/tree/master/packages/babel-preset-stage-2
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ];

  return {
    presets,
    plugins,
  };
};
