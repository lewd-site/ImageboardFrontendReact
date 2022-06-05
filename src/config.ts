export const config = {
  api: {
    baseUrl: process.env.API_URL || 'http://localhost',
  },
  content: {
    baseUrl: process.env.CONTENT_URL || 'http://localhost',
  },
  sse: {
    url: process.env.SSE_URL || 'http://localhost/sse',
  },
} as const;

export default config;
