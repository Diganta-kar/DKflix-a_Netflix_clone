export default async function handler(req, res) {
  // Extract path and other query parameters
  const { path, ...queryParams } = req.query;

  if (!path) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing path parameter' }));
    return;
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'API key not configured on server' }));
    return;
  }

  // Construct TMDB API URL
  const searchParams = new URLSearchParams(queryParams);
  searchParams.append('api_key', apiKey);

  const targetUrl = `https://api.themoviedb.org/3/${path}?${searchParams.toString()}`;

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();

    res.statusCode = response.status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(data));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to fetch from TMDB' }));
  }
}
