/**
 * Runtime Template for Exported HTML
 *
 * This module exports the JavaScript runtime that is embedded in exported HTML files.
 * The runtime handles data loading, binding resolution, chart rendering, and auto-print.
 */

/**
 * The runtime JavaScript template as a string.
 * This is injected into the exported HTML file and executed at runtime.
 *
 * Features:
 * - Data loading from embedded sample data or external JSON file
 * - Binding resolution for {{data.path}} syntax
 * - Chart.js initialization for chart components
 * - Component-specific binding handlers
 * - Auto-print trigger after rendering
 */
export const RUNTIME_TEMPLATE = `
// LabVIEW Report Builder - Runtime Engine
// Generated template runtime

(function() {
  'use strict';

  // Configuration (injected by compiler)
  var CONFIG = window.TEMPLATE_CONFIG || {};
  var COMPONENTS = window.COMPONENTS || [];
  var SAMPLE_DATA = window.SAMPLE_DATA || null;

  // ============================================
  // Binding Resolution Utilities
  // ============================================

  /**
   * Resolve a data binding path to its value
   * @param {string} path - Binding path (e.g., "data.meta.title" or "meta.title")
   * @param {object} data - The data object to resolve from
   * @returns {*} The resolved value or undefined
   */
  function resolveBinding(path, data) {
    if (!path || !data) return undefined;

    // Normalize path by removing 'data.' prefix if present
    var normalizedPath = path;
    if (normalizedPath.startsWith('data.')) {
      normalizedPath = normalizedPath.slice(5);
    }

    var parts = normalizedPath.split('.');
    var current = data;

    for (var i = 0; i < parts.length; i++) {
      if (current == null) return undefined;
      current = current[parts[i]];
    }

    return current;
  }

  /**
   * Interpolate text with {{data.path}} bindings
   * @param {string} text - Text containing binding markers
   * @param {object} data - The data object to resolve bindings from
   * @returns {string} Text with bindings replaced by values
   */
  function interpolateText(text, data) {
    if (!text || !data) return text || '';

    return text.replace(/\\{\\{([^}]+)\\}\\}/g, function(match, path) {
      var value = resolveBinding(path.trim(), data);
      if (value == null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
  }

  /**
   * Check if a value contains data binding patterns
   * @param {string} value - Value to check
   * @returns {boolean} True if contains bindings
   */
  function hasBinding(value) {
    return !!(value && typeof value === 'string' && value.indexOf('{{') !== -1 && value.indexOf('}}') !== -1);
  }

  // ============================================
  // Data Loading
  // ============================================

  /**
   * Load report data from embedded sample or external file
   * @returns {Promise<object|null>} The loaded data or null
   */
  async function loadData() {
    // Use embedded sample data if available
    if (SAMPLE_DATA) {
      console.log('[Runtime] Using embedded sample data');
      return SAMPLE_DATA;
    }

    // Try to fetch from external file
    try {
      var response = await fetch(CONFIG.dataPath || './report_data.json');
      if (response.ok) {
        var data = await response.json();
        console.log('[Runtime] Loaded data from', CONFIG.dataPath || './report_data.json');
        return data;
      } else {
        console.warn('[Runtime] Could not load data file:', response.status, response.statusText);
      }
    } catch (e) {
      console.warn('[Runtime] Error loading data file:', e.message);
    }

    return null;
  }

  // ============================================
  // Component Binding Handlers
  // ============================================

  /**
   * Apply bindings to a text component
   */
  function bindTextComponent(el, comp, data) {
    var props = comp.props || {};

    // Check for explicit binding
    if (props.binding) {
      var value = resolveBinding(props.binding, data);
      if (value != null) {
        el.textContent = String(value);
        return;
      }
    }

    // Check for inline bindings in text
    if (props.text && hasBinding(props.text)) {
      el.innerHTML = interpolateText(props.text, data);
    }
  }

  /**
   * Apply bindings to a table component
   */
  function bindTableComponent(el, comp, data) {
    var props = comp.props || {};

    if (!props.binding) return;

    var tableData = resolveBinding(props.binding, data);
    if (!tableData || !Array.isArray(tableData)) {
      console.warn('[Runtime] Table binding did not resolve to an array:', props.binding);
      return;
    }

    // Get column configuration
    var columns = props.columns || [];
    var autoGenerateColumns = columns.length === 0;

    // Auto-generate columns from first row if needed
    if (autoGenerateColumns && tableData.length > 0) {
      var firstRow = tableData[0];
      if (typeof firstRow === 'object' && firstRow !== null) {
        columns = Object.keys(firstRow).map(function(key) {
          return { key: key, label: key };
        });
      }
    }

    // Build table HTML
    var html = '<thead><tr>';
    for (var i = 0; i < columns.length; i++) {
      html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: left; background: #f5f5f5;">' +
              escapeHtml(columns[i].label || columns[i].key) + '</th>';
    }
    html += '</tr></thead><tbody>';

    for (var rowIdx = 0; rowIdx < tableData.length; rowIdx++) {
      var row = tableData[rowIdx];
      html += '<tr>';
      for (var colIdx = 0; colIdx < columns.length; colIdx++) {
        var cellValue = row[columns[colIdx].key];
        if (cellValue == null) cellValue = '';
        if (typeof cellValue === 'object') cellValue = JSON.stringify(cellValue);
        html += '<td style="padding: 8px; border: 1px solid #ddd;">' + escapeHtml(String(cellValue)) + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody>';

    el.innerHTML = html;
  }

  /**
   * Apply bindings to an indicator component
   */
  function bindIndicatorComponent(el, comp, data) {
    var props = comp.props || {};

    if (!props.binding) return;

    var statusValue = resolveBinding(props.binding, data);
    if (statusValue == null) return;

    // Normalize status value
    var status = String(statusValue).toLowerCase();
    var validStatuses = ['pass', 'fail', 'warning', 'neutral'];
    if (validStatuses.indexOf(status) === -1) {
      status = status === 'true' || status === '1' || status === 'yes' ? 'pass' : 'neutral';
    }

    // Update data attribute
    el.setAttribute('data-status', status);

    // Update visual styling based on status
    var statusConfig = {
      pass: { bgColor: 'rgba(57, 255, 20, 0.15)', borderColor: '#39ff14', textColor: '#39ff14', icon: '\\u2714', label: props.passLabel || 'PASS' },
      fail: { bgColor: 'rgba(255, 107, 107, 0.15)', borderColor: '#ff6b6b', textColor: '#ff6b6b', icon: '\\u2716', label: props.failLabel || 'FAIL' },
      warning: { bgColor: 'rgba(255, 176, 0, 0.15)', borderColor: '#ffb000', textColor: '#ffb000', icon: '\\u26A0', label: props.warningLabel || 'WARNING' },
      neutral: { bgColor: 'rgba(156, 163, 175, 0.15)', borderColor: '#9ca3af', textColor: '#9ca3af', icon: '\\u2212', label: 'N/A' }
    };

    var config = statusConfig[status];
    var badge = el.querySelector('[style*="display: flex"]');
    if (badge) {
      badge.style.borderColor = config.borderColor;
      badge.style.background = config.bgColor;

      var icon = badge.querySelector('span:first-child');
      var label = badge.querySelector('span:last-child');
      if (icon) {
        icon.style.color = config.textColor;
        icon.innerHTML = '&#' + config.icon.charCodeAt(0) + ';';
      }
      if (label) {
        label.style.color = config.textColor;
        label.textContent = props.label || config.label;
      }
    }
  }

  /**
   * Apply bindings to a gauge component
   */
  function bindGaugeComponent(el, comp, data) {
    var props = comp.props || {};

    if (!props.binding) return;

    var value = resolveBinding(props.binding, data);
    if (value == null || isNaN(value)) return;

    var min = props.min || 0;
    var max = props.max || 100;
    var percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    var unit = props.unit || '%';

    // Update data attribute
    el.setAttribute('data-value', value);

    // Update SVG arc
    var svgSize = Math.min(el.offsetWidth, el.offsetHeight) - 20;
    var strokeWidth = 12;
    var radius = (svgSize / 2) - strokeWidth;
    var circumference = 2 * Math.PI * radius;
    var arcLength = circumference * 0.75;
    var offset = arcLength - (arcLength * percentage / 100);

    var valueCircle = el.querySelector('circle:nth-child(2)');
    if (valueCircle) {
      valueCircle.setAttribute('stroke-dasharray', (arcLength - offset) + ' ' + circumference);
    }

    // Update center display
    var centerSpan = el.querySelector('span[style*="font-weight: bold"]');
    if (centerSpan) {
      centerSpan.textContent = value.toFixed(0) + unit;
    }
  }

  /**
   * Apply bindings to a progress bar component
   */
  function bindProgressBarComponent(el, comp, data) {
    var props = comp.props || {};

    if (!props.binding) return;

    var value = resolveBinding(props.binding, data);
    if (value == null || isNaN(value)) return;

    var min = props.min || 0;
    var max = props.max || 100;
    var percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

    // Update progress bar fill
    var fill = el.querySelector('[style*="background:"]');
    if (fill) {
      fill.style.width = percentage + '%';
    }

    // Update label if present
    var label = el.querySelector('span');
    if (label) {
      label.textContent = percentage.toFixed(0) + '%';
    }
  }

  /**
   * Apply bindings to a datetime component
   */
  function bindDateTimeComponent(el, comp, data) {
    var props = comp.props || {};

    if (!props.binding) return;

    var value = resolveBinding(props.binding, data);
    if (value == null) return;

    var date = new Date(value);
    if (isNaN(date.getTime())) {
      el.textContent = String(value);
      return;
    }

    var format = props.format || 'locale';
    var displayValue;

    switch (format) {
      case 'iso':
        displayValue = date.toISOString();
        break;
      case 'date':
        displayValue = date.toLocaleDateString();
        break;
      case 'time':
        displayValue = date.toLocaleTimeString();
        break;
      case 'locale':
      default:
        displayValue = date.toLocaleString();
        break;
    }

    el.textContent = displayValue;
  }

  // ============================================
  // Chart Rendering
  // ============================================

  // Store chart instances for potential updates
  var chartInstances = {};

  /**
   * Render all chart components
   */
  function renderCharts(data) {
    if (typeof Chart === 'undefined') {
      console.warn('[Runtime] Chart.js not loaded, skipping chart rendering');
      return;
    }

    for (var i = 0; i < COMPONENTS.length; i++) {
      var comp = COMPONENTS[i];
      if (!comp || comp.type !== 'chart') continue;

      var container = document.getElementById(comp.id);
      if (!container) continue;

      var canvas = container.querySelector('canvas') || document.getElementById(comp.id + '-canvas');
      if (!canvas) continue;

      renderChart(canvas, comp, data);
    }
  }

  /**
   * Render a single chart
   */
  function renderChart(canvas, comp, data) {
    var props = comp.props || {};
    var chartType = props.chartType || 'bar';
    var title = props.title || '';

    // Interpolate title if it has bindings
    if (hasBinding(title)) {
      title = interpolateText(title, data);
    }

    // Build labels array
    var labels = props.labels || [];
    if (typeof labels === 'string') {
      labels = labels.split(',').map(function(l) { return l.trim(); });
    }

    // Build datasets
    var datasets = [];
    var datasetsConfig = props.datasets || [];

    if (datasetsConfig.length > 0) {
      // Multi-dataset mode
      for (var i = 0; i < datasetsConfig.length; i++) {
        var ds = datasetsConfig[i];
        var datasetData = ds.data || [];

        // Resolve binding if present
        if (ds.binding) {
          var resolvedData = resolveBinding(ds.binding, data);
          if (resolvedData && Array.isArray(resolvedData)) {
            datasetData = resolvedData;
          }
        } else if (ds.dataPoints && typeof ds.dataPoints === 'string') {
          // Parse static data points
          datasetData = ds.dataPoints.split(',').map(function(d) {
            return parseFloat(d.trim());
          }).filter(function(d) { return !isNaN(d); });
        }

        // Use labels from data if available
        if (Array.isArray(datasetData) && datasetData.length > 0) {
          var firstItem = datasetData[0];
          if (typeof firstItem === 'object' && firstItem !== null) {
            // Data is array of objects - extract values and potentially labels
            if (firstItem.label !== undefined && labels.length === 0) {
              labels = datasetData.map(function(item) { return item.label; });
            }
            if (firstItem.value !== undefined) {
              datasetData = datasetData.map(function(item) { return item.value; });
            }
          }
        }

        datasets.push({
          label: ds.label || 'Dataset ' + (i + 1),
          data: datasetData,
          backgroundColor: ds.backgroundColor || (chartType === 'pie' ? getDefaultChartColors() : 'rgba(0, 102, 204, 0.5)'),
          borderColor: ds.borderColor || '#0066cc',
          borderWidth: ds.borderWidth || 2,
          type: ds.type || (chartType === 'pie' ? undefined : chartType),
          yAxisID: ds.yAxisID || 'y',
          fill: ds.fill || false,
          tension: ds.tension || 0.3
        });
      }
    } else {
      // Single dataset mode (backward compatible)
      var dataPoints = props.dataPoints || '65, 59, 80, 81, 56';
      var primaryData = [];

      // Try to resolve from binding first
      if (props.binding) {
        var resolved = resolveBinding(props.binding, data);
        if (resolved) {
          if (Array.isArray(resolved)) {
            primaryData = resolved;
            // Check if data has labels
            if (resolved[0] && resolved[0].label !== undefined && labels.length === 0) {
              labels = resolved.map(function(item) { return item.label; });
              primaryData = resolved.map(function(item) { return item.value !== undefined ? item.value : item; });
            }
          } else if (resolved.data && Array.isArray(resolved.data)) {
            primaryData = resolved.data;
            if (resolved.labels && Array.isArray(resolved.labels)) {
              labels = resolved.labels;
            }
          }
        }
      }

      // Fall back to static data points
      if (primaryData.length === 0) {
        primaryData = dataPoints.split(',').map(function(d) {
          return parseFloat(d.trim());
        }).filter(function(d) { return !isNaN(d); });
      }

      datasets.push({
        label: props.label || 'Dataset',
        data: primaryData,
        backgroundColor: chartType === 'pie' ? getDefaultChartColors() : (props.backgroundColor || 'rgba(0, 102, 204, 0.5)'),
        borderColor: props.borderColor || '#0066cc',
        borderWidth: 2,
        fill: false,
        tension: chartType === 'line' ? 0.3 : 0
      });
    }

    // Build chart options
    var options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#333' }
        },
        title: {
          display: true,
          text: title,
          color: '#333',
          font: { size: 16 }
        }
      }
    };

    // Add scales for non-pie charts
    if (chartType !== 'pie') {
      options.scales = props.options && props.options.scales ? props.options.scales : {
        y: {
          beginAtZero: true,
          ticks: { color: '#666' },
          grid: { color: 'rgba(0,0,0,0.1)' }
        },
        x: {
          ticks: { color: '#666' },
          grid: { color: 'rgba(0,0,0,0.1)' }
        }
      };
    }

    // Destroy existing chart instance if present
    if (chartInstances[comp.id]) {
      chartInstances[comp.id].destroy();
    }

    // Create chart
    try {
      chartInstances[comp.id] = new Chart(canvas.getContext('2d'), {
        type: chartType,
        data: {
          labels: labels,
          datasets: datasets
        },
        options: options
      });
      console.log('[Runtime] Rendered chart:', comp.id);
    } catch (e) {
      console.error('[Runtime] Error rendering chart:', comp.id, e);
    }
  }

  /**
   * Get default chart colors array
   */
  function getDefaultChartColors() {
    return [
      '#0066cc', '#28a745', '#fd7e14', '#dc3545', '#17a2b8',
      '#6f42c1', '#007bff', '#c82333', '#20c997', '#ffc107'
    ];
  }

  // ============================================
  // Apply Bindings
  // ============================================

  /**
   * Apply bindings to all components
   */
  function applyBindings(data) {
    if (!data) {
      console.warn('[Runtime] No data available for binding');
      return;
    }

    console.log('[Runtime] Applying bindings to', COMPONENTS.length, 'components');

    for (var i = 0; i < COMPONENTS.length; i++) {
      var comp = COMPONENTS[i];
      if (!comp) continue;

      var el = document.getElementById(comp.id);
      if (!el) continue;

      switch (comp.type) {
        case 'text':
        case 'Text':
          bindTextComponent(el, comp, data);
          break;
        case 'table':
        case 'Table':
          bindTableComponent(el, comp, data);
          break;
        case 'indicator':
        case 'Indicator':
          bindIndicatorComponent(el, comp, data);
          break;
        case 'gauge':
        case 'Gauge':
          bindGaugeComponent(el, comp, data);
          break;
        case 'progressbar':
        case 'ProgressBar':
          bindProgressBarComponent(el, comp, data);
          break;
        case 'datetime':
        case 'DateTime':
          bindDateTimeComponent(el, comp, data);
          break;
        // Chart bindings are handled in renderCharts
      }
    }
  }

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Escape HTML special characters
   */
  function escapeHtml(str) {
    if (!str) return '';
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(str).replace(/[&<>"']/g, function(char) {
      return htmlEscapes[char] || char;
    });
  }

  // ============================================
  // Main Initialization
  // ============================================

  /**
   * Main initialization function
   */
  async function init() {
    console.log('[Runtime] Initializing template...');

    try {
      // 1. Load data
      var data = await loadData();

      // 2. Apply bindings
      if (data) {
        applyBindings(data);
      }

      // 3. Render charts (requires Chart.js to be loaded)
      // Wait a tick for Chart.js to be ready if loaded asynchronously
      await new Promise(function(resolve) { setTimeout(resolve, 100); });

      if (data) {
        renderCharts(data);
      }

      // 4. Auto-print after short delay for rendering
      if (CONFIG.autoPrint) {
        setTimeout(function() {
          console.log('[Runtime] Triggering auto-print...');
          try {
            window.print();
          } catch (e) {
            console.warn('[Runtime] Auto-print failed:', e);
          }
        }, CONFIG.printDelay || 500);
      }

      console.log('[Runtime] Template initialization complete');
    } catch (error) {
      console.error('[Runtime] Template initialization error:', error);
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`

/**
 * Get the runtime template as a string
 * @returns The runtime JavaScript code
 */
export function getRuntimeTemplate(): string {
  return RUNTIME_TEMPLATE
}

/**
 * Watermark HTML constant for free tier exports
 */
export const WATERMARK_HTML = `
<div id="watermark" style="position: fixed; bottom: 20px; right: 20px; padding: 8px 16px; background: rgba(0,0,0,0.7); color: white; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border-radius: 4px; z-index: 9999; pointer-events: none;">
  Generated with LabVIEW Report Builder (Free Plan)
</div>
<style>
@media print {
  #watermark {
    position: fixed;
    bottom: 10px;
    right: 10px;
    font-size: 10px;
    background: rgba(200,200,200,0.3);
    color: #666;
  }
}
</style>
`

/**
 * Get watermark HTML if watermark should be included
 * @param include - Whether to include the watermark
 * @returns Watermark HTML string or empty string
 */
export function getWatermarkHtml(include: boolean): string {
  return include ? WATERMARK_HTML : ''
}
