export default async function handler(req, res) {
  const base = "http://tv.bdiptv.net";
  const server = "http://103.89.248.14:8082/";

  try {
    // Fetch homepage
    const response = await fetch(base);
    const html = await response.text();

    // Extract all stream names
    const matches = [...html.matchAll(/play\.php\?stream=([^']+)/g)];

    let m3u = "#EXTM3U\n";

    for (const match of matches) {
      const stream = match[1];
      const name = stream.replace(/-/g, " ");

      try {
        const tokenRes = await fetch(`${base}/play.php?stream=${stream}`);
        const tokenText = await tokenRes.text();

        const tokenMatch = tokenText.match(/token=([^&]+)/);
        const token = tokenMatch ? tokenMatch[1] : "";

        const url = `${server}${stream}/index.fmp4.m3u8?token=${token}`;

        m3u += `#EXTINF:-1, ${name}\n${url}\n`;

      } catch (e) {
        console.log("Error with stream:", stream);
      }
    }

    res.setHeader("Content-Type", "application/x-mpegURL");
    res.send(m3u);

  } catch (err) {
    res.status(500).send("Error generating playlist");
  }
}
