// AWS CloudWatch Chart Exporter JavaScript

// Application data
const appData = {
  "namespaces": [
    {
      "value": "AWS/EC2",
      "label": "AWS/EC2 - Elastic Compute Cloud",
      "metrics": ["CPUUtilization", "NetworkIn", "NetworkOut", "DiskReadOps", "DiskWriteOps"]
    },
    {
      "value": "AWS/RDS", 
      "label": "AWS/RDS - Relational Database Service",
      "metrics": ["CPUUtilization", "DatabaseConnections", "FreeableMemory", "ReadIOPS", "WriteIOPS"]
    },
    {
      "value": "AWS/Lambda",
      "label": "AWS/Lambda - Lambda Functions", 
      "metrics": ["Invocations", "Duration", "Errors", "Throttles", "ConcurrentExecutions"]
    },
    {
      "value": "AWS/ApplicationELB",
      "label": "AWS/ApplicationELB - Application Load Balancer",
      "metrics": ["RequestCount", "TargetResponseTime", "HTTPCode_Target_2XX_Count", "HTTPCode_Target_4XX_Count"]
    },
    {
      "value": "AWS/S3",
      "label": "AWS/S3 - Simple Storage Service",
      "metrics": ["BucketSizeBytes", "NumberOfObjects", "AllRequests", "GetRequests"]
    }
  ],
  "regions": [
    {"value": "us-east-1", "label": "US East (N. Virginia)"},
    {"value": "us-west-2", "label": "US West (Oregon)"},
    {"value": "eu-west-1", "label": "Europe (Ireland)"},
    {"value": "ap-southeast-1", "label": "Asia Pacific (Singapore)"},
    {"value": "ap-northeast-1", "label": "Asia Pacific (Tokyo)"}
  ],
  "statistics": ["Average", "Sum", "Maximum", "Minimum", "SampleCount"],
  "templates": [
    {
      "name": "EC2 CPU Utilization",
      "config": {
        "namespace": "AWS/EC2",
        "metric": "CPUUtilization", 
        "dimensions": "InstanceId=i-1234567890abcdef0",
        "statistic": "Average",
        "period": 300,
        "title": "EC2 Instance CPU Utilization"
      }
    },
    {
      "name": "RDS Database Connections",
      "config": {
        "namespace": "AWS/RDS",
        "metric": "DatabaseConnections",
        "dimensions": "DBInstanceIdentifier=mydb-instance", 
        "statistic": "Average",
        "period": 300,
        "title": "RDS Database Connections"
      }
    },
    {
      "name": "Lambda Invocations",
      "config": {
        "namespace": "AWS/Lambda",
        "metric": "Invocations",
        "dimensions": "FunctionName=my-function",
        "statistic": "Sum", 
        "period": 300,
        "title": "Lambda Function Invocations"
      }
    }
  ]
};

// DOM Elements
const elements = {
  // AWS Config
  accessKeyId: document.getElementById('accessKeyId'),
  secretAccessKey: document.getElementById('secretAccessKey'),
  region: document.getElementById('region'),
  
  // Metric Config
  namespace: document.getElementById('namespace'),
  metricName: document.getElementById('metricName'),
  dimensions: document.getElementById('dimensions'),
  statistic: document.getElementById('statistic'),
  startTime: document.getElementById('startTime'),
  endTime: document.getElementById('endTime'),
  period: document.getElementById('period'),
  periodValue: document.getElementById('periodValue'),
  chartTitle: document.getElementById('chartTitle'),
  
  // Actions
  generatePreview: document.getElementById('generatePreview'),
  exportChart: document.getElementById('exportChart'),
  downloadPng: document.getElementById('downloadPng'),
  
  // Display
  jsonConfig: document.getElementById('jsonConfig'),
  loadingIndicator: document.getElementById('loadingIndicator'),
  exportResult: document.getElementById('exportResult'),
  chartImage: document.getElementById('chartImage'),
  
  // Templates
  templatesGrid: document.getElementById('templatesGrid')
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  loadSavedSettings();
  setupEventListeners();
});

function initializeApp() {
  populateDropdowns();
  setupDefaultValues();
  renderTemplates();
}

function populateDropdowns() {
  // Populate regions
  appData.regions.forEach(region => {
    const option = document.createElement('option');
    option.value = region.value;
    option.textContent = region.label;
    elements.region.appendChild(option);
  });
  
  // Populate namespaces
  appData.namespaces.forEach(namespace => {
    const option = document.createElement('option');
    option.value = namespace.value;
    option.textContent = namespace.label;
    elements.namespace.appendChild(option);
  });
  
  // Populate statistics
  appData.statistics.forEach(stat => {
    const option = document.createElement('option');
    option.value = stat;
    option.textContent = stat;
    elements.statistic.appendChild(option);
  });
}

function setupDefaultValues() {
  // Set default time range (last 1 hour)
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  elements.endTime.value = formatDateTimeLocal(now);
  elements.startTime.value = formatDateTimeLocal(oneHourAgo);
  
  // Set default region
  elements.region.value = 'us-east-1';
  
  // Set default statistic
  elements.statistic.value = 'Average';
}

function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function setupEventListeners() {
  // Namespace change - update metrics
  elements.namespace.addEventListener('change', function() {
    updateMetricsDropdown();
    saveSettings();
  });
  
  // Period slider
  elements.period.addEventListener('input', function() {
    elements.periodValue.textContent = this.value;
    saveSettings();
  });
  
  // Generate preview
  elements.generatePreview.addEventListener('click', generatePreview);
  
  // Export chart
  elements.exportChart.addEventListener('click', exportChart);
  
  // Download PNG
  elements.downloadPng.addEventListener('click', downloadPng);
  
  // Save settings on input changes
  const formInputs = [
    elements.accessKeyId, elements.secretAccessKey, elements.region,
    elements.metricName, elements.dimensions, elements.statistic,
    elements.startTime, elements.endTime, elements.chartTitle
  ];
  
  formInputs.forEach(input => {
    input.addEventListener('change', saveSettings);
    input.addEventListener('input', saveSettings);
  });
}

function updateMetricsDropdown() {
  const selectedNamespace = elements.namespace.value;
  elements.metricName.innerHTML = '<option value="">Chọn metric...</option>';
  
  if (selectedNamespace) {
    const namespace = appData.namespaces.find(ns => ns.value === selectedNamespace);
    if (namespace) {
      namespace.metrics.forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = metric;
        elements.metricName.appendChild(option);
      });
    }
  }
}

function renderTemplates() {
  elements.templatesGrid.innerHTML = '';
  
  appData.templates.forEach(template => {
    const templateCard = document.createElement('div');
    templateCard.className = 'template-card';
    templateCard.innerHTML = `
      <h3>${template.name}</h3>
      <p>Namespace: ${template.config.namespace}</p>
      <div class="template-details">
        <span class="template-tag">${template.config.metric}</span>
        <span class="template-tag">${template.config.statistic}</span>
        <span class="template-tag">${template.config.period}s</span>
      </div>
    `;
    
    templateCard.addEventListener('click', () => loadTemplate(template));
    elements.templatesGrid.appendChild(templateCard);
  });
}

function loadTemplate(template) {
  const config = template.config;
  
  // Load template data into form
  elements.namespace.value = config.namespace;
  updateMetricsDropdown();
  
  setTimeout(() => {
    elements.metricName.value = config.metric;
    elements.dimensions.value = config.dimensions;
    elements.statistic.value = config.statistic;
    elements.period.value = config.period;
    elements.periodValue.textContent = config.period;
    elements.chartTitle.value = config.title;
    
    // Generate preview automatically
    generatePreview();
    saveSettings();
  }, 100);
}

function generatePreview() {
  if (!validateForm()) {
    return;
  }
  
  const config = buildWidgetConfig();
  elements.jsonConfig.value = JSON.stringify(config, null, 2);
}

function validateForm() {
  let isValid = true;
  const requiredFields = [
    { element: elements.accessKeyId, name: 'AWS Access Key ID' },
    { element: elements.secretAccessKey, name: 'AWS Secret Access Key' },
    { element: elements.region, name: 'Region' },
    { element: elements.namespace, name: 'Namespace' },
    { element: elements.metricName, name: 'Metric Name' },
    { element: elements.statistic, name: 'Statistic' },
    { element: elements.startTime, name: 'Start Time' },
    { element: elements.endTime, name: 'End Time' }
  ];
  
  // Clear previous errors
  document.querySelectorAll('.form-control').forEach(el => {
    el.classList.remove('error');
  });
  document.querySelectorAll('.error-message').forEach(el => {
    el.remove();
  });
  
  requiredFields.forEach(field => {
    if (!field.element.value.trim()) {
      field.element.classList.add('error');
      showFieldError(field.element, `${field.name} là bắt buộc`);
      isValid = false;
    }
  });
  
  // Validate time range
  if (elements.startTime.value && elements.endTime.value) {
    const startTime = new Date(elements.startTime.value);
    const endTime = new Date(elements.endTime.value);
    
    if (startTime >= endTime) {
      elements.endTime.classList.add('error');
      showFieldError(elements.endTime, 'Thời gian kết thúc phải sau thời gian bắt đầu');
      isValid = false;
    }
  }
  
  return isValid;
}

function showFieldError(element, message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  element.parentNode.appendChild(errorDiv);
}

function buildWidgetConfig() {
  const dimensions = parseDimensions(elements.dimensions.value);
  
  return {
    "MetricWidget": {
      "metrics": [
        [
          elements.namespace.value,
          elements.metricName.value,
          ...dimensions
        ]
      ],
      "period": parseInt(elements.period.value),
      "stat": elements.statistic.value,
      "region": elements.region.value,
      "title": elements.chartTitle.value || `${elements.metricName.value} Chart`,
      "start": elements.startTime.value,
      "end": elements.endTime.value,
      "width": 600,
      "height": 400
    }
  };
}

function parseDimensions(dimensionsStr) {
  const dimensions = [];
  if (dimensionsStr.trim()) {
    const pairs = dimensionsStr.split(',');
    pairs.forEach(pair => {
      const [key, value] = pair.split('=').map(s => s.trim());
      if (key && value) {
        dimensions.push(key, value);
      }
    });
  }
  return dimensions;
}

async function exportChart() {
  if (!validateForm()) {
    return;
  }
  
  // Show loading
  elements.loadingIndicator.classList.remove('hidden');
  elements.exportResult.classList.add('hidden');
  
  try {
    // Simulate API call delay
    await sleep(2000);
    
    // In a real implementation, this would call AWS GetMetricWidgetImage API
    // For demo purposes, we'll use the provided chart image
    const chartImageUrl = 'https://pplx-res.cloudinary.com/image/upload/v1749178119/pplx_code_interpreter/642676b8_sztosb.jpg';
    
    // Display the chart
    elements.chartImage.src = chartImageUrl;
    elements.chartImage.alt = elements.chartTitle.value || 'Generated CloudWatch Chart';
    
    // Hide loading and show result
    elements.loadingIndicator.classList.add('hidden');
    elements.exportResult.classList.remove('hidden');
    
    showSuccessMessage('Biểu đồ đã được tạo thành công!');
    
  } catch (error) {
    elements.loadingIndicator.classList.add('hidden');
    showErrorMessage('Có lỗi xảy ra khi tạo biểu đồ: ' + error.message);
  }
}

function downloadPng() {
  const chartTitle = elements.chartTitle.value || 'cloudwatch-chart';
  const filename = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
  
  // Create a canvas to convert the image to PNG
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = elements.chartImage;
  
  canvas.width = img.naturalWidth || 600;
  canvas.height = img.naturalHeight || 400;
  
  // Draw image on canvas
  ctx.drawImage(img, 0, 0);
  
  // Convert to blob and download
  canvas.toBlob(function(blob) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showSuccessMessage(`File ${filename} đã được tải xuống!`);
  }, 'image/png');
}

function saveSettings() {
  const settings = {
    accessKeyId: elements.accessKeyId.value,
    region: elements.region.value,
    namespace: elements.namespace.value,
    metricName: elements.metricName.value,
    dimensions: elements.dimensions.value,
    statistic: elements.statistic.value,
    period: elements.period.value,
    chartTitle: elements.chartTitle.value
  };
  
  try {
    localStorage.setItem('cloudwatch-exporter-settings', JSON.stringify(settings));
  } catch (e) {
    // LocalStorage not available in sandbox, ignore silently
  }
}

function loadSavedSettings() {
  try {
    const savedSettings = localStorage.getItem('cloudwatch-exporter-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      
      elements.accessKeyId.value = settings.accessKeyId || '';
      elements.region.value = settings.region || 'us-east-1';
      elements.namespace.value = settings.namespace || '';
      elements.metricName.value = settings.metricName || '';
      elements.dimensions.value = settings.dimensions || '';
      elements.statistic.value = settings.statistic || 'Average';
      elements.period.value = settings.period || 300;
      elements.periodValue.textContent = settings.period || 300;
      elements.chartTitle.value = settings.chartTitle || '';
      
      // Update metrics dropdown if namespace is selected
      if (settings.namespace) {
        updateMetricsDropdown();
        setTimeout(() => {
          elements.metricName.value = settings.metricName || '';
        }, 100);
      }
    }
  } catch (e) {
    // LocalStorage not available in sandbox, ignore silently
  }
}

function showSuccessMessage(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success';
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #d4edda;
    color: #155724;
    padding: 12px 16px;
    border: 1px solid #c3e6cb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 1000;
    max-width: 300px;
  `;
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 4000);
}

function showErrorMessage(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-error';
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f8d7da;
    color: #721c24;
    padding: 12px 16px;
    border: 1px solid #f5c6cb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 1000;
    max-width: 300px;
  `;
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle form submission
document.getElementById('configForm').addEventListener('submit', function(e) {
  e.preventDefault();
});

document.getElementById('metricForm').addEventListener('submit', function(e) {
  e.preventDefault();
});