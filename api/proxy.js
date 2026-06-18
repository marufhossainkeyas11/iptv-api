export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('url param missing');

  const cookie = req.query.cookie || '';
  const userAgent = 'Mozilla/5.0 (Linux; Android 9; Redmi S2 Build/PKQ1.181203.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.79 Mobile Safari/537.36';

  try {
    const upstream = await fetch(decodeURIComponent(targetUrl), {
      headers: {
        'Cookie': decodeURIComponent(cookie),
        'User-Agent': userAgent,
        'Referer': 'https://toffeelive.com/',
        'Origin': 'https://toffeelive.com'
      }
    });

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);

    const text = await upstream.text();

    // M3U8 হলে relative URL গুলো proxy দিয়ে rewrite করতে হবে
    if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
      const baseUrl = decodeURIComponent(targetUrl).replace(/\/[^\/]*$/, '/');
      const proxied = text.split('\n').map(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return line;
        // absolute URL
        if (line.startsWith('http')) {
          return `/api/proxy?url=${encodeURIComponent(line)}&cookie=${req.query.cookie || ''}`;
        }
        // relative URL
        const absolute = baseUrl + line;
        return `/api/proxy?url=${encodeURIComponent(absolute)}&cookie=${req.query.cookie || ''}`;
      }).join('\n');
      return res.send(proxied);
    }

    res.send(text);
  } catch (e) {
    res.status(500).send('Proxy error: ' + e.message);
  }
}
