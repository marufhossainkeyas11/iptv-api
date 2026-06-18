import https from 'https';

export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('url param missing');

  const cookie = req.query.cookie || '';
  const userAgent = 'Mozilla/5.0 (Linux; Android 9; Redmi S2 Build/PKQ1.181203.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.79 Mobile Safari/537.36';

  const decoded = decodeURIComponent(targetUrl);
  const urlObj = new URL(decoded);

  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'GET',
    headers: {
      'Cookie': decodeURIComponent(cookie),
      'User-Agent': userAgent,
      'Referer': 'https://toffeelive.com/',
      'Origin': 'https://toffeelive.com'
    }
  };

  res.setHeader('Access-Control-Allow-Origin', '*');

  https.get(options, (upstream) => {
    const ct = upstream.headers['content-type'] || 'application/octet-stream';
    res.setHeader('Content-Type', ct);

    let body = '';
    upstream.on('data', chunk => body += chunk);
    upstream.on('end', () => {
      if (ct.includes('mpegurl') || decoded.includes('.m3u8')) {
        const baseUrl = decoded.replace(/\/[^\/]*$/, '/');
        const proxied = body.split('\n').map(line => {
          const l = line.trim();
          if (!l || l.startsWith('#')) return l;
          if (l.startsWith('http')) {
            return `/api/proxy?url=${encodeURIComponent(l)}&cookie=${req.query.cookie || ''}`;
          }
          return `/api/proxy?url=${encodeURIComponent(baseUrl + l)}&cookie=${req.query.cookie || ''}`;
        }).join('\n');
        return res.send(proxied);
      }
      res.send(body);
    });
  }).on('error', e => res.status(500).send('Proxy error: ' + e.message));
}
