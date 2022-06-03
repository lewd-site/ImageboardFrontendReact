export const config = {
  api: {
    baseUrl: process.env.API_URL || 'http://localhost',
  },
  content: {
    baseUrl: process.env.CONTENT_URL || 'http://localhost',
  },
} as const;

export default config;
