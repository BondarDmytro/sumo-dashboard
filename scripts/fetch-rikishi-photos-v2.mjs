// fetch_rikishi_photos_v2: parsing profile pages - real photo path (270x474/{realId}.jpg)
// nskId.jpg pattern was wrong -> 557 placeholder files; this version greps actual src from profile HTML
import fs from 'fs'
import path from 'path'

const DIR = 'public/rikishi'
const NO_IMAGE_SIZE = 15931  // kanto_no_image.jpg placeholder byte size
const PROFILE = (nskId) => `https://www.sumo.or.jp/EnSumoDataRikishi/profile/${nskId}/`
const PHOTO_RE = /img\/sumo_data\/rikishi\/270x474\/([\w]+)\.jpg/

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function main() {
  const res = await fetch('https://sumo-api.com/api/rikishis?limit=1000')
  const data = await res.json()
  const rikishi = (data.records || []).filter(r => r.nskId)
  console.log(`rikishi with nskId: ${rikishi.length}`)

  let fixed = 0, skipped = 0, noPhoto = 0, failed = 0
  for (const r of rikishi) {
    const dest = path.join(DIR, `${r.id}.jpg`)
    // skip only valid photos (exists and NOT placeholder-size)
    if (fs.existsSync(dest) && fs.statSync(dest).size !== NO_IMAGE_SIZE) { skipped++; continue }

    try {
      const html = await (await fetch(PROFILE(r.nskId))).text()
      const m = html.match(PHOTO_RE)
      if (!m) {
        // profile has no 270x474 photo at all (real rookie without photo)
        if (fs.existsSync(dest)) fs.unlinkSync(dest)  // remove placeholder
        noPhoto++
        console.log(`no photo: ${r.shikonaEn} (nskId ${r.nskId})`)
        await sleep(300)
        continue
      }
      const url = `https://www.sumo.or.jp/img/sumo_data/rikishi/270x474/${m[1]}.jpg`
      const img = await fetch(url)
      if (!img.ok) { failed++; console.log(`fetch fail ${img.status}: ${r.shikonaEn}`); await sleep(300); continue }
      const buf = Buffer.from(await img.arrayBuffer())
      if (buf.length === NO_IMAGE_SIZE) {
        if (fs.existsSync(dest)) fs.unlinkSync(dest)
        noPhoto++
      } else {
        fs.writeFileSync(dest, buf)
        fixed++
        console.log(`ok: ${r.shikonaEn} -> ${m[1]}.jpg (${(buf.length/1024).toFixed(0)}K)`)
      }
    } catch (e) {
      failed++
      console.log(`error: ${r.shikonaEn}: ${e.message}`)
    }
    await sleep(300)  // vvichlyvist do sumo.or.jp
  }
  console.log(`\nfixed: ${fixed}, valid skipped: ${skipped}, no photo on site: ${noPhoto}, failed: ${failed}`)
}
main()
