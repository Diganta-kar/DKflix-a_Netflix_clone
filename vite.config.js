import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          detail: resolve(__dirname, 'detail.html'),
        },
      },
    },
    plugins: [
      {
        name: 'tmdb-api-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url.startsWith('/api/tmdb')) {
              let targetUrl = '';
              try {
                const urlObj = new URL(req.url, 'http://localhost');
                const pathParam = urlObj.searchParams.get('path');
                if (!pathParam) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing path parameter' }));
                  return;
                }

                const apiKey = env.TMDB_API_KEY;
                if (!apiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'API key not configured in .env' }));
                  return;
                }

                // Build the target TMDB URL parameters
                const targetParams = new URLSearchParams();
                urlObj.searchParams.forEach((val, key) => {
                  if (key !== 'path') {
                    targetParams.append(key, val);
                  }
                });
                targetParams.append('api_key', apiKey);

                targetUrl = `https://api.themoviedb.org/3/${pathParam}?${targetParams.toString()}`;
                
                const fetchRes = await fetch(targetUrl);
                const data = await fetchRes.json();

                res.statusCode = fetchRes.status;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify(data));
              } catch (err) {
                console.error("[Proxy Error] failed fetching:", targetUrl, err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Local proxy fetch failed', details: err.message, stack: err.stack }));
              }
              return;
            }
            next();
          });
        }
      }
    ]
  };
});