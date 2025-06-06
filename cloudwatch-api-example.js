// AWS CloudWatch GetMetricWidgetImage API Example
// Sử dụng AWS SDK for JavaScript v3

import { CloudWatchClient, GetMetricWidgetImageCommand } from "@aws-sdk/client-cloudwatch";

class CloudWatchChartExporter {
    constructor(accessKeyId, secretAccessKey, region) {
        this.client = new CloudWatchClient({
            credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey
            },
            region: region
        });
    }

    // Tạo widget configuration JSON
    createWidgetConfig(options) {
        const {
            namespace,
            metricName,
            dimensions = {},
            statistic = 'Average',
            period = 300,
            startTime = '-PT3H', // 3 hours ago
            endTime = 'PT0H',    // now
            title = 'CloudWatch Metric',
            width = 1200,
            height = 600
        } = options;

        // Convert dimensions object to array format
        const dimensionArray = [];
        for (const [key, value] of Object.entries(dimensions)) {
            dimensionArray.push(key, value);
        }

        const widgetConfig = {
            title: title,
            view: "timeSeries",
            stacked: false,
            metrics: [
                [namespace, metricName, ...dimensionArray, { "stat": statistic }]
            ],
            period: period,
            start: startTime,
            end: endTime,
            width: width,
            height: height,
            region: this.client.config.region
        };

        return JSON.stringify(widgetConfig);
    }

    // Export chart thành PNG
    async exportChart(widgetConfig) {
        try {
            const command = new GetMetricWidgetImageCommand({
                MetricWidget: widgetConfig,
                OutputFormat: 'png'
            });

            const response = await this.client.send(command);

            // Response chứa base64 encoded PNG image
            const imageData = response.MetricWidgetImage;

            return {
                success: true,
                imageData: imageData,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Download file PNG
    downloadPNG(imageData, filename = 'cloudwatch-chart.png') {
        try {
            // Convert base64 to binary
            const binaryData = atob(imageData);
            const arrayBuffer = new ArrayBuffer(binaryData.length);
            const uint8Array = new Uint8Array(arrayBuffer);

            for (let i = 0; i < binaryData.length; i++) {
                uint8Array[i] = binaryData.charCodeAt(i);
            }

            // Create blob và download
            const blob = new Blob([arrayBuffer], { type: 'image/png' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Download failed:', error);
            return false;
        }
    }

    // List available metrics
    async listMetrics(namespace = null, metricName = null) {
        try {
            const { ListMetricsCommand } = await import("@aws-sdk/client-cloudwatch");

            const params = {};
            if (namespace) params.Namespace = namespace;
            if (metricName) params.MetricName = metricName;

            const command = new ListMetricsCommand(params);
            const response = await this.client.send(command);

            return {
                success: true,
                metrics: response.Metrics || [],
                nextToken: response.NextToken
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Usage Examples:

// 1. Khởi tạo exporter
const exporter = new CloudWatchChartExporter(
    'YOUR_ACCESS_KEY_ID',
    'YOUR_SECRET_ACCESS_KEY', 
    'us-east-1'
);

// 2. Export EC2 CPU Utilization chart
async function exportEC2CPUChart() {
    const widgetConfig = exporter.createWidgetConfig({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensions: {
            'InstanceId': 'i-1234567890abcdef0'
        },
        statistic: 'Average',
        period: 300,
        title: 'EC2 Instance CPU Utilization',
        startTime: '-PT24H', // 24 hours ago
        endTime: 'PT0H'      // now
    });

    const result = await exporter.exportChart(widgetConfig);

    if (result.success) {
        // Download PNG file
        exporter.downloadPNG(result.imageData, 'ec2-cpu-utilization.png');
        console.log('Chart exported successfully!');
    } else {
        console.error('Export failed:', result.error);
    }
}

// 3. Export RDS Database Connections
async function exportRDSConnectionsChart() {
    const widgetConfig = exporter.createWidgetConfig({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensions: {
            'DBInstanceIdentifier': 'mydb-instance'
        },
        statistic: 'Average',
        period: 300,
        title: 'RDS Database Connections',
        width: 1400,
        height: 800
    });

    const result = await exporter.exportChart(widgetConfig);

    if (result.success) {
        exporter.downloadPNG(result.imageData, 'rds-connections.png');
    }
}

// 4. Export Lambda Invocations với multiple functions
async function exportLambdaInvocationsChart() {
    // Multi-metric widget config
    const widgetConfig = JSON.stringify({
        title: "Lambda Functions Invocations",
        view: "timeSeries",
        stacked: false,
        metrics: [
            ["AWS/Lambda", "Invocations", "FunctionName", "function-1", { "stat": "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "function-2", { "stat": "Sum" }],
            ["AWS/Lambda", "Invocations", "FunctionName", "function-3", { "stat": "Sum" }]
        ],
        period: 300,
        start: "-PT6H",
        end: "PT0H",
        width: 1200,
        height: 600,
        region: "us-east-1"
    });

    const result = await exporter.exportChart(widgetConfig);

    if (result.success) {
        exporter.downloadPNG(result.imageData, 'lambda-invocations.png');
    }
}

// 5. List available metrics for namespace
async function listEC2Metrics() {
    const result = await exporter.listMetrics('AWS/EC2');

    if (result.success) {
        console.log('Available EC2 metrics:');
        result.metrics.forEach(metric => {
            console.log(`- ${metric.MetricName}`);
            console.log(`  Dimensions: ${JSON.stringify(metric.Dimensions)}`);
        });
    }
}

// 6. Error handling example
async function exportWithErrorHandling() {
    try {
        const widgetConfig = exporter.createWidgetConfig({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensions: {
                'InstanceId': 'i-invalid-instance'
            },
            title: 'Test Chart'
        });

        const result = await exporter.exportChart(widgetConfig);

        if (result.success) {
            exporter.downloadPNG(result.imageData, 'test-chart.png');
            showSuccess('Chart exported successfully!');
        } else {
            showError(`Export failed: ${result.error}`);
        }
    } catch (error) {
        showError(`Unexpected error: ${error.message}`);
    }
}

function showSuccess(message) {
    console.log('✅', message);
    // Update UI to show success message
}

function showError(message) {
    console.error('❌', message);
    // Update UI to show error message
}

// Export class for use in modules
export default CloudWatchChartExporter;
