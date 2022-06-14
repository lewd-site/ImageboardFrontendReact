const { createProxyMiddleware } = require('http-proxy-middleware');

require('dotenv').config();

module.exports = function (app) {
  const proxyMiddleware = createProxyMiddleware({ target: process.env.CONTENT_URL });

  function filter(req, res, next) {
    if (
      [
        '/android-chrome-192x192.png',
        '/android-chrome-512x512.png',
        '/apple-touch-icon.png',
        '/audio.png',
        '/audio.webp',
        '/browserconfig.xml',
        '/favicon-16x16.png',
        '/favicon-32x32.png',
        '/favicon.ico',
        '/mstile-144x144.png',
        '/mstile-150x150.png',
        '/mstile-310x150.png',
        '/mstile-310x310.png',
        '/mstile-70x70.png',
        '/robots.txt',
        '/safari-pinned-tab.svg',
        '/site.webmanifest',
      ].includes(req.url)
    ) {
      proxyMiddleware(req, res, next);
      return;
    }

    next();
  }

  app.use(filter);
};
