import * as fs from 'fs'
import * as path from 'path'
import '../src/lib/Math'


;(async function main(setDir: string) {

  const lighthouseCols: Record<string, keyof typeof AuditName | 'time'> = {
    'Time': 'time',
    'Score': 'score',
    'Time to First Byte (TTFB)': 'server-response-time',
    'First Contentful Paint (FCP)': 'first-contentful-paint',
    'Time to Interactive (TTI)': 'interactive',
    'Total Blocking Time (TBT)': 'total-blocking-time',
    'Largest Contentful Paint (LCP)': 'largest-contentful-paint',
    'Cumulative Layout Shift (CLS)': 'cumulative-layout-shift',
    'Total Byte Weight (TBW)': 'total-byte-weight',
  }


  if (!setDir) return console.log(`usage: node ${__filename} <setPath>`)
  if (!fs.existsSync(setDir)) return console.error(setDir + " dir d.n.e.")

  const allStats = getStats(setDir)
  const statsFiltered = allStats.map(stat => pick(stat, Object.values(lighthouseCols)))
  const mergedStats = mergeStats(statsFiltered)
  const csv = 
    // Object.keys(lighthouseCols).join(',') + '\n' +
    Object.values(mergedStats).join(',')

  process.stdout.write(csv)
})(process.argv[2])

/**
 * Transforms an array of audit stats into winsorized averages
 * @param stats - array of audit stats
 * @returns - record of stat name -> winsorized average
 */
function mergeStats(stats: Stat[]) {
  const statNames = Object.keys(stats[0]) as (keyof Stat)[]
  const merged = Object.fromEntries(statNames.map(statName => [statName, merge(stats.map(s => s[statName] as string))]))
  return merged

  // Transforms an array of numbers into a winsorized average
  function merge(array: (number | string)[]) {
    if (array.every(v => typeof v === 'number')) {
      const bounded = boundToStdDeviation(array as number[])
      const averages = Math.average(bounded)
      // const averages = Math.average(array as number[])
      const merged = averages.toFixed(2)
      return merged
    } else return array[0]
  }

  // A winsorizing algorthm based on Standard Deviation
  function boundToStdDeviation(array: number[]) {
    const avg = Math.average(array)
    const stdDeviation = Math.standardDeviation(array)
    const upperBound = avg + stdDeviation
    const lowerBound = avg - stdDeviation
    const bounded = array.map(v => Math.bound(v, lowerBound, upperBound))
    return bounded
  }
}



type Stat = Partial<Metrics> & {time: string}
function getStats(dir: string): Stat[] {
  const stats: Stat[] = []
  fs.readdirSync(dir).forEach(file => {
    const report: Report = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
    const metrics = mapReportToMetrics(report)
    stats.push({
      time: report.fetchTime,
      ...metrics,
    })
  })
  return stats
 
  function mapReportToMetrics(report: Report) {
    // benchmarkIndex environment
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
  "score",
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