module.exports = ({ config }) => {
  const isDev = process.env.APP_VARIANT === 'development';

  return {
    ...config,
    name: isDev ? 'Agrom Dev' : (config.name || 'Agrom'),
    android: {
      ...config.android,
      package: isDev ? 'com.eyong.agrom' : (config.android?.package || 'com.wisknowl.agromarket'),
    },
  };
};
