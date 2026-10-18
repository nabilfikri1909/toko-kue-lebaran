module.exports = {
  apps: [
    {
      name: 'toko-kue-web',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
        HOSTNAME: '0.0.0.0'
      }
    }
  ]
};
