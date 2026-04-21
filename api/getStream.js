// /api/channels.js
import fs from 'fs/promises';
import path from 'path';

async function resolveStream(id) {
  // এটা তোমার own backend/API হওয়া উচিত
  const r = await fetch(`${process.env.RESOLVER_URL}?id=${id}`);
  if (!r.ok) return null;

  const data = await r.json();
  return data.stream || null;
}

export default async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'channels.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const channels = JSON.parse(raw);

    const updated = await Promise.all(
      channels.map(async (ch) => {
        const freshStream = await resolveStream(ch.id);
        return {
          ...ch,
          stream: freshStream || ch.stream || ""
        };
      })
    );

    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
