import { VercelRequest, VercelResponse } from  '@vercel/node';
import { parse } from 'node-html-parser';
import axios from 'axios';
import Earthquake from '../types/Earthquake';

const url = 'http://www.koeri.boun.edu.tr/scripts/lst0.asp'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { data: html } = await axios.get(url)
  const $ = parse(html)
  const rawText = $.querySelector("pre")?.text || ""
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line)
  const earthquakeLines = lines.slice(6)

  const parsed = earthquakeLines.map(line => {
    let sizes = {
      md: +line.slice(55, 58).trim(),
      ml: +line.slice(60, 63).trim(),
      mw: +line.slice(65, 68).trim(),
    }
    return {
      tarih: line.slice(0, 10).trim(),
      saat: line.slice(11, 19).trim(),
      enlem: line.slice(21, 28).trim(),
      boylam: line.slice(31, 38).trim(),
      derinlik_km: line.slice(40, 49).trim(),
      buyukluk: sizes.md || sizes.ml || sizes.mw,
      type: !isNaN(sizes.md) ? 'md' : !isNaN(sizes.ml) ? 'ml': 'mw',
      konum: line.slice(70,119).trim(),
      nitelik: line.slice(120).trim()
    } as Earthquake
  })

  res.json(parsed);
}