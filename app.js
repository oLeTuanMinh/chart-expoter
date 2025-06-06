// Application data
const metricsData = {
    'AWS/EC2': ['CPUUtilization', 'NetworkIn', 'NetworkOut', 'DiskReadOps', 'DiskWriteOps'],
    'AWS/RDS': ['CPUUtilization', 'DatabaseConnections', 'FreeableMemory', 'ReadIOPS', 'WriteIOPS'],
    'AWS/Lambda': ['Invocations', 'Duration', 'Errors', 'Throttles', 'ConcurrentExecutions'],
    'AWS/ELB': ['RequestCount', 'TargetResponseTime', 'HTTPCode_Target_2XX_Count', 'HTTPCode_Target_4XX_Count']
};

const dimensionNames = {
    'AWS/EC2': 'InstanceId',
    'AWS/RDS': 'DBInstanceIdentifier', 
    'AWS/Lambda': 'FunctionName',
    'AWS/ELB': 'LoadBalancer'
};

const sampleValues = {
    'AWS/EC2': 'i-0b7c8d02813c56a21',
    'AWS/RDS': 'mydb-instance',
    'AWS/Lambda': 'my-function',
    'AWS/ELB': 'my-load-balancer'
};

// Global AWS configuration
let cloudwatch = null;

// Tab switching functionality
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Update JSON preview if on browser tab
    if (tabName === 'browser') {
        updateJsonPreview();
    }
}

// Update metrics dropdown based on namespace selection
function updateMetrics() {
    const namespace = document.getElementById('namespace').value;
    const metricSelect = document.getElementById('metricName');
    const dimensionNameInput = document.getElementById('dimensionName');
    const dimensionValueInput = document.getElementById('dimensionValue');
    
    // Clear existing options
    metricSelect.innerHTML = '';
    
    // Add new options
    metricsData[namespace].forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = metric;
        metricSelect.appendChild(option);
    });
    
    // Update dimension name and sample value
    dimensionNameInput.value = dimensionNames[namespace] || 'InstanceId';
    dimensionValueInput.value = sampleValues[namespace] || 'i-0b7c8d02813c56a21';
    
    // Update JSON preview
    updateJsonPreview();
}

// Update CLI metrics dropdown
function updateCliMetrics() {
    const namespace = document.getElementById('cliNamespace').value;
    const metricSelect = document.getElementById('cliMetric');
    
    // Clear existing options
    metricSelect.innerHTML = '';
    
    // Add new options
    metricsData[namespace].forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = metric;
        metricSelect.appendChild(option);
    });
    
    // Update dimension name and sample value
    document.getElementById('cliDimName').value = dimensionNames[namespace] || 'InstanceId';
    document.getElementById('cliDimValue').value = sampleValues[namespace] || 'i-0b7c8d02813c56a21';
}

// Generate widget JSON configuration with proper format
function generateWidgetConfig() {
    const namespace = document.getElementById('namespace').value;
    const metricName = document.getElementById('metricName').value;
    const dimensionName = document.getElementById('dimensionName').value;
    const dimensionValue = document.getElementById('dimensionValue').value;
    
    return {
        view: "timeSeries",  // Required field that was missing!
        stacked: false,
        metrics: [[namespace, metricName, dimensionName, dimensionValue]],
        width: 600,
        height: 400,
        start: "-PT3H",
        end: "PT0H",
        period: 300,
        stat: "Average",
        region: document.getElementById('region').value
    };
}

// Update JSON preview
function updateJsonPreview() {
    const config = generateWidgetConfig();
    const jsonPreview = document.getElementById('jsonPreview');
    
    if (jsonPreview) {
        jsonPreview.textContent = JSON.stringify(config, null, 2);
        highlightJson(jsonPreview);
    }
}

// Simple JSON syntax highlighting
function highlightJson(element) {
    let html = element.textContent;
    
    // Highlight strings
    html = html.replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:');
    html = html.replace(/:\s*"([^"]+)"/g, ': <span class="string">"$1"</span>');
    
    // Highlight numbers
    html = html.replace(/:\s*(\d+)/g, ': <span class="number">$1</span>');
    
    // Highlight booleans
    html = html.replace(/:\s*(true|false)/g, ': <span class="boolean">$1</span>');
    
    element.innerHTML = html;
}

// Export chart using browser SDK
async function exportChart() {
    const button = document.getElementById('exportBtn');
    const result = document.getElementById('result');
    
    // Get credentials
    const accessKey = document.getElementById('accessKey').value;
    const secretKey = document.getElementById('secretKey').value;
    const region = document.getElementById('region').value;
    
    if (!accessKey || !secretKey) {
        showResult('error', 'Vui lòng nhập AWS credentials.');
        return;
    }
    
    // Show loading state
    button.classList.add('loading');
    button.disabled = true;
    
    try {
        // Configure AWS SDK
        AWS.config.update({
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
            region: region
        });
        
        cloudwatch = new AWS.CloudWatch();
        
        // Generate widget configuration
        const widgetConfig = generateWidgetConfig();
        
        const params = {
            MetricWidget: JSON.stringify(widgetConfig),
            OutputFormat: 'png'
        };
        
        // Make API call
        const response = await cloudwatch.getMetricWidgetImage(params).promise();
        
        // Convert response to image
        const imageBlob = new Blob([response.MetricWidgetImage], { type: 'image/png' });
        const imageUrl = URL.createObjectURL(imageBlob);
        
        showResult('success', 'Biểu đồ đã được tạo thành công!', imageUrl);
        
    } catch (error) {
        console.error('Export error:', error);
        
        let errorMessage = 'Có lỗi xảy ra khi xuất biểu đồ.';
        
        if (error.code === 'NetworkingError' || error.message.includes('CORS')) {
            errorMessage = `
                <strong>Lỗi CORS:</strong> Trình duyệt chặn request do CORS policy.<br>
                <strong>Giải pháp:</strong> Sử dụng tab "AWS CLI Generator" để tạo lệnh CLI thay thế.
            `;
        } else if (error.code === 'UnauthorizedOperation' || error.code === 'InvalidUserID.NotFound') {
            errorMessage = `
                <strong>Lỗi xác thực:</strong> AWS credentials không hợp lệ hoặc thiếu quyền.<br>
                <strong>Giải pháp:</strong> Kiểm tra Access Key/Secret Key và đảm bảo IAM user có quyền cloudwatch:GetMetricWidgetImage.
            `;
        } else if (error.code === 'ValidationException') {
            errorMessage = `
                <strong>Lỗi validation:</strong> JSON widget configuration không hợp lệ.<br>
                <strong>Giải pháp:</strong> Kiểm tra format JSON trong phần preview.
            `;
        }
        
        showResult('error', errorMessage);
    } finally {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Show result message
function showResult(type, message, imageUrl = null) {
    const result = document.getElementById('result');
    result.className = `result-section ${type}`;
    
    let html = `<p>${message}</p>`;
    
    if (imageUrl) {
        html += `
            <img src="${imageUrl}" alt="CloudWatch Chart" class="result-image">
            <p><a href="${imageUrl}" download="cloudwatch-chart.png" class="btn btn--secondary">Tải xuống hình ảnh</a></p>
        `;
    }
    
    result.innerHTML = html;
    result.classList.remove('hidden');
}

// Generate CLI command
function updateCliCommand() {
    const region = document.getElementById('cliRegion').value;
    const namespace = document.getElementById('cliNamespace').value;
    const metric = document.getElementById('cliMetric').value;
    const dimName = document.getElementById('cliDimName').value;
    const dimValue = document.getElementById('cliDimValue').value;
    const timePeriod = document.getElementById('cliTimePeriod').value;
    
    const widgetConfig = {
        view: "timeSeries",
        stacked: false,
        metrics: [[namespace, metric, dimName, dimValue]],
        width: 600,
        height: 400,
        start: timePeriod,
        end: "PT0H",
        period: 300,
        stat: "Average"
    };
    
    const command = `aws cloudwatch get-metric-widget-image --region ${region} \\
    --metric-widget '${JSON.stringify(widgetConfig)}' \\
    --output-format png \\
    --output text | base64 --decode > chart.png`;
    
    document.getElementById('cliCommand').textContent = command;
}

// Copy CLI command to clipboard
async function copyCliCommand() {
    const command = document.getElementById('cliCommand').textContent;
    
    try {
        await navigator.clipboard.writeText(command);
        
        // Show temporary success message
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Đã sao chép!';
        button.classList.add('btn--success');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('btn--success');
        }, 2000);
        
    } catch (err) {
        console.error('Failed to copy text: ', err);
        
        // Fallback: select text
        const range = document.createRange();
        range.selectNode(document.getElementById('cliCommand'));
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        
        alert('Không thể tự động sao chép. Vui lòng sử dụng Ctrl+C để sao chép text đã chọn.');
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Set up initial state
    updateMetrics();
    updateCliMetrics();
    updateJsonPreview();
    updateCliCommand();
    
    // Add event listeners for JSON preview updates
    const inputs = ['namespace', 'metricName', 'dimensionName', 'dimensionValue', 'region'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateJsonPreview);
            element.addEventListener('input', updateJsonPreview);
        }
    });
    
    // Add event listeners for CLI command updates
    const cliInputs = ['cliRegion', 'cliNamespace', 'cliMetric', 'cliDimName', 'cliDimValue', 'cliTimePeriod'];
    cliInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateCliCommand);
            element.addEventListener('input', updateCliCommand);
        }
    });
    
    // Show browser limitations warning
    console.log('AWS CloudWatch Chart Exporter - Fixed Version');
    console.log('Common issues fixed:');
    console.log('1. Added required "view": "timeSeries" field to JSON widget');
    console.log('2. Better CORS error handling');
    console.log('3. Proper response format handling');
    console.log('4. AWS CLI alternative provided');
});

// Utility function to validate AWS credentials format
function validateCredentials(accessKey, secretKey) {
    const accessKeyPattern = /^AKIA[0-9A-Z]{16}$/;
    const secretKeyPattern = /^[A-Za-z0-9/+=]{40}$/;
    
    return {
        validAccessKey: accessKeyPattern.test(accessKey),
        validSecretKey: secretKeyPattern.test(secretKey)
    };
}

// Add credentials validation on input
document.addEventListener('DOMContentLoaded', function() {
    const accessKeyInput = document.getElementById('accessKey');
    const secretKeyInput = document.getElementById('secretKey');
    
    if (accessKeyInput) {
        accessKeyInput.addEventListener('blur', function() {
            const validation = validateCredentials(this.value, '');
            if (this.value && !validation.validAccessKey) {
                this.style.borderColor = 'var(--color-error)';
                this.title = 'Access Key format không hợp lệ. Phải bắt đầu với AKIA và có 20 ký tự.';
            } else {
                this.style.borderColor = '';
                this.title = '';
            }
        });
    }
    
    if (secretKeyInput) {
        secretKeyInput.addEventListener('blur', function() {
            const validation = validateCredentials('', this.value);
            if (this.value && !validation.validSecretKey) {
                this.style.borderColor = 'var(--color-error)';
                this.title = 'Secret Key format không hợp lệ. Phải có 40 ký tự.';
            } else {
                this.style.borderColor = '';
                this.title = '';
            }
        });
    }
});

// Global error handler for unhandled promises
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (event.reason && event.reason.code === 'NetworkingError') {
        showResult('error', `
            <strong>Lỗi mạng:</strong> Không thể kết nối đến AWS API.<br>
            <strong>Có thể do:</strong> CORS policy, firewall, hoặc AWS service unavailable.<br>
            <strong>Giải pháp:</strong> Sử dụng AWS CLI hoặc server-side implementation.
        `);
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter to export chart
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (document.querySelector('#browser-tab.active')) {
            exportChart();
        }
    }
    
    // Ctrl/Cmd + C when CLI command is focused
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.id === 'cliCommand') {
            copyCliCommand();
            event.preventDefault();
        }
    }
});