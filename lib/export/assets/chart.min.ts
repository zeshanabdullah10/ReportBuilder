/**
 * Chart.js Bundle for Template Export
 *
 * This module provides the Chart.js library for self-contained HTML exports.
 * The CDN URL is embedded in the exported HTML for runtime loading.
 */

/**
 * Chart.js CDN URL for runtime loading
 * Using jsDelivr CDN for reliable, fast delivery
 */
export const CHART_JS_CDN_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'

/**
 * Chart.js version number
 */
export const CHART_JS_VERSION = '4.4.1'

/**
 * Alternative CDN URLs for fallback
 */
export const CHART_JS_CDN_URLS = {
  jsdelivr: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  unpkg: 'https://unpkg.com/chart.js@4.4.1/dist/chart.umd.min.js',
  cdnjs: 'https://cdnjs.cloudflare.com/ajax/libs/chart.js/4.4.1/chart.umd.min.js',
}

/**
 * Generate script tag for Chart.js inclusion
 *
 * @param useFallbacks - Include fallback CDN URLs
 * @returns HTML script tag(s) for Chart.js
 */
export function getChartJsScriptTag(useFallbacks: boolean = false): string {
  if (useFallbacks) {
    // Generate script with fallback logic
    return `
<script>
(function() {
  var cdnUrls = ${JSON.stringify(Object.values(CHART_JS_CDN_URLS))};
  var loaded = false;

  function loadScript(url, callback) {
    var script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    script.onerror = function() {
      console.warn('Failed to load Chart.js from: ' + url);
      if (cdnUrls.length > 0) {
        loadScript(cdnUrls.shift(), callback);
      }
    };
    document.head.appendChild(script);
  }

  loadScript(cdnUrls.shift(), function() {
    loaded = true;
    window.dispatchEvent(new Event('chartjs-loaded'));
  });
})();
</script>`
  }

  // Simple single CDN URL
  return `<script src="${CHART_JS_CDN_URL}"></script>`
}

/**
 * Default colors for charts (matching builder component)
 */
export const DEFAULT_CHART_COLORS = [
  '#0066cc', '#28a745', '#fd7e14', '#dc3545', '#17a2b8',
  '#6f42c1', '#007bff', '#c82333', '#20c997', '#ffc107'
]
