import * as fs from 'fs'
import * as path from 'path'


;(async function main(beforeDir: string, afterDir: string) {

  const lighthouseCols: Record<string, keyof typeof AuditName | 'time'> = {
    'Time': 'time',
    'Time to First Byte (TTFB)': 'server-response-time',
    'First Contentful Paint (FCP)': 'first-contentful-paint',
    'Time to Interactive (TTI)': 'interactive',
    'Total Blocking Time (TBT)': 'total-blocking-time',
    'Largest Contentful Paint (LCP)': 'largest-contentful-paint',
    'Cumulative Layout Shift (CLS)': 'cumulative-layout-shift',
    'Total Byte Weight (TBW)': 'total-byte-weight',
  }

  const allCols = {
    'Variant': 'variant',
    ...lighthouseCols,
  }

  if (!beforeDir || !afterDir) return console.log(`usage: node ${__filename} <beforePath> <afterPath>`)
  if (!fs.existsSync(beforeDir)) return console.error(beforeDir + " dir d.n.e.")
  if (!fs.existsSync(afterDir)) return console.error(afterDir + " dir d.n.e.")

  const before = getStats(beforeDir).map(stat => Object.values({'variant': 'before', ...pick(stat, Object.values(lighthouseCols))}))
  const after = getStats(afterDir).map(stat => Object.values({'variant': 'after', ...pick(stat, Object.values(lighthouseCols))}))

  const detailCsv = [Object.keys(allCols), ...before, ...after].map(r => r.join(',')).join('\n')

  process.stdout.write(detailCsv)
})(process.argv[2], process.argv[3])


type Stat = Partial<Metrics> & {time: string}
function getStats(dir: string): Stat[] {
  const stats: Stat[] = []
  fs.readdirSync(dir).forEach(file => {
    const report: Report = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
    stats.push({
      time: report.fetchTime,
      ...mapReportToMetrics(report),
    })
  });
  return stats
 
  function mapReportToMetrics(report: Report) {
    return Object.fromEntries(Object.entries(report.audits).map(([k,v]) => [k,v.numericValue])) as Metrics
  }
}

export function pick<T extends Record<string, any>, K extends (keyof T)> (obj: T, keys: K[]): Pick<T, K> {
  const res: Partial<Pick<T, K>> = {}
  keys?.forEach(k => {
    if (k in obj) res[k] = obj[k]
  })
  return res as Pick<T, K>
}



interface Report {
  fetchTime: string
  environment: {
    benchmarkIndex: number
  }
  audits: Audits
}
type Audits = Record<keyof typeof AuditName, AuditMetric>
enum AuditName {
  "first-contentful-paint",
  "largest-contentful-paint",
  "first-meaningful-paint",
  "speed-index",
  "screenshot-thumbnails",
  "final-screenshot",
  "estimated-input-latency",
  "total-blocking-time",
  "max-potential-fid",
  "cumulative-layout-shift",
  "server-response-time",
  "first-cpu-idle",
  "interactive",
  "user-timings",
  "critical-request-chains",
  "redirects",
  "mainthread-work-breakdown",
  "bootup-time",
  "uses-rel-preload",
  "uses-rel-preconnect",
  "font-display",
  "diagnostics",
  "network-requests",
  "network-rtt",
  "network-server-latency",
  "main-thread-tasks",
  "metrics",
  "performance-budget",
  "timing-budget",
  "resource-summary",
  "third-party-summary",
  "third-party-facades",
  "largest-contentful-paint-element",
  "layout-shift-elements",
  "long-tasks",
  "non-composited-animations",
  "unsized-images",
  "preload-lcp-image",
  "full-page-screenshot",
  "uses-long-cache-ttl",
  "total-byte-weight",
  "offscreen-images",
  "render-blocking-resources",
  "unminified-css",
  "unminified-javascript",
  "unused-css-rules",
  "unused-javascript",
  "uses-webp-images",
  "uses-optimized-images",
  "uses-text-compression",
  "uses-responsive-images",
  "efficient-animated-content",
  "duplicated-javascript",
  "legacy-javascript",
  "dom-size",
  "no-document-write",
  "uses-http2",
  "uses-passive-event-listeners",
}
interface AuditMetric {
  "id": string
  "title": string
  "description": string
  "score": number
  "scoreDisplayMode": string
  "numericValue": number
  "numericUnit": string
  "displayValue": string
}
type Metrics = Record<keyof typeof AuditName, AuditMetric['numericValue']>