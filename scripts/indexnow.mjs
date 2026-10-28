// Tells Bing, Yandex and other IndexNow search engines that pages changed.
// Run after a deploy:  npm run indexnow
// The key is public by design; it must match public/db4a622595f709242231bdb47ee9e629.txt.
const KEY = "db4a622595f709242231bdb47ee9e629"
const SITE = process.env.SITE_URL || "https://code-motive.dev"

const xml = await (await fetch(`${SITE}/sitemap.xml`)).text()
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (!urlList.length) throw new Error("No URLs found in the sitemap")

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
})
console.log(`IndexNow: submitted ${urlList.length} URLs, HTTP ${res.status}`)
if (res.status >= 400) process.exitCode = 1
