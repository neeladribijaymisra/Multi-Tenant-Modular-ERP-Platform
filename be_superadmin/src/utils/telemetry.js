const MAX_REQUEST_METRICS = 1000
const requestMetrics = []

export function recordRequestMetric(metric) {
  requestMetrics.push(metric)

  if (requestMetrics.length > MAX_REQUEST_METRICS) {
    requestMetrics.shift()
  }
}

export function getRequestMetrics({ since } = {}) {
  if (!since) return [...requestMetrics]

  const sinceTime = new Date(since).getTime()
  return requestMetrics.filter((metric) => new Date(metric.at).getTime() >= sinceTime)
}

export function summarizeRequestMetrics({ since } = {}) {
  const metrics = getRequestMetrics({ since })
  const totalRequests = metrics.length
  const averageResponseTime =
    totalRequests > 0
      ? Math.round(metrics.reduce((sum, metric) => sum + metric.durationMs, 0) / totalRequests)
      : 0

  return {
    totalRequests,
    averageResponseTime,
    errorCount: metrics.filter((metric) => metric.statusCode >= 500).length,
    lastRequestAt: metrics[metrics.length - 1]?.at || null,
  }
}
