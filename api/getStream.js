import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

let cache = {};

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Missing id" });
    }

    // ⏱️ cache (30s)
    if (cache[id] && Date.now() - cache[id].time < 30000) {
        return res.json(cache[id].data);
    }

    const targetUrl = `https://tv.cloudfront.fun/redint/${id}`;

    let browser;

    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: true,
        });

        const page = await browser.newPage();
        let streamUrl = "";

        page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('.m3u8')) {
                streamUrl = url;
            }
        });

        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        await browser.close();

        if (!streamUrl) {
            return res.status(404).json({ error: "Stream not found" });
        }

        const result = { id, stream: streamUrl };

        cache[id] = {
            time: Date.now(),
            data: result
        };

        return res.json(result);

    } catch (err) {
        if (browser) await browser.close();
        return res.status(500).json({ error: err.message });
    }
}
