
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS from your frontend
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request (browser pre-flight check)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 1. Fetch the list of Sahaba from the external API
    const listResponse = await fetch('https://alsirat.com/api/sahaba');
    if (!listResponse.ok) {
      throw new Error(`External API List Error: ${listResponse.statusText}`);
    }
    const listData = await listResponse.json();

    // 2. Pick a random Sahabi based on the day of the year (Consistency)
    // This ensures all users see the same Sahabi for 24 hours
    const startOfYear = new Date(new Date().getFullYear(), 0, 0);
    const diff = new Date().getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Assuming listData is an array of objects with 'id'
    // If the API returns a different structure, this needs adjustment
    const list = Array.isArray(listData) ? listData : (listData.data || []);
    
    if (list.length === 0) throw new Error("No data returned from API");

    const index = dayOfYear % list.length;
    const selectedId = list[index].id;

    // 3. Fetch specific details for that Sahabi
    const detailResponse = await fetch(`https://alsirat.com/api/sahaba/${selectedId}`);
    if (!detailResponse.ok) {
       throw new Error(`External API Detail Error: ${detailResponse.statusText}`);
    }
    const sahabiDetails = await detailResponse.json();

    // 4. Return the data to your frontend
    res.status(200).json(sahabiDetails);
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: 'Failed to fetch Sahabi data' });
  }
}
