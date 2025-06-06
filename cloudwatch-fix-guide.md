# Hướng Dẫn Sửa Lỗi AWS CloudWatch Chart Exporter

## Vấn Đề Gốc Rễ

Khi bạn test với AWS CLI thành công:
```bash
aws cloudwatch get-metric-widget-image --region ap-southeast-1 \
    --metric-widget '{"metrics":[["AWS/EC2","CPUUtilization","InstanceId","i-0b7c8d02813c56a21"]]}' \
    --output-format png \
    --output text | base64 --decode > image.png
```

Nhưng ứng dụng web không hoạt động đúng. Có 5 nguyên nhân chính:

## 1. JSON Widget Configuration Thiếu Trường Bắt Buộc

### ❌ JSON Sai (trong app cũ):
```json
{
  "metrics": [["AWS/EC2", "CPUUtilization", "InstanceId", "i-0b7c8d02813c56a21"]]
}
```

### ✅ JSON Đúng (đã sửa):
```json
{
  "view": "timeSeries",
  "stacked": false,
  "metrics": [["AWS/EC2", "CPUUtilization", "InstanceId", "i-0b7c8d02813c56a21"]],
  "width": 600,
  "height": 400,
  "start": "-PT3H",
  "end": "PT0H",
  "period": 300,
  "stat": "Average",
  "region": "ap-southeast-1"
}
```

**Trường `view: "timeSeries"` là BẮT BUỘC!**

## 2. CORS (Cross-Origin Resource Sharing) Issues

Trình duyệt chặn request đến AWS CloudWatch API do CORS policy. 

### Các triệu chứng:
- Console error: "CORS policy blocked the request"
- Network tab shows preflight OPTIONS request failed
- No response từ CloudWatch API

### Giải pháp:
1. **Khuyến nghị:** Dùng AWS CLI thay vì browser
2. Tạo API Gateway + Lambda proxy
3. Dùng server-side application (Node.js/Python)

## 3. Authentication Issues

AWS SDK trong browser có hạn chế về credentials:

### Vấn đề:
- Hardcode credentials không an toàn
- Browser environment không support IAM roles
- Session credentials expire

### Giải pháp:
```javascript
// Dùng AWS Cognito cho browser authentication
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'your-identity-pool-id'
});
```

## 4. Response Format Issues

CloudWatch API trả về XML format, không phải JSON:

### ❌ Code sai:
```javascript
const response = await cloudwatch.getMetricWidgetImage(params).promise();
// response.MetricWidgetImage đã là base64 string
const imageUrl = `data:image/png;base64,${response.MetricWidgetImage}`;
```

### ✅ Code đúng:
```javascript
const response = await cloudwatch.getMetricWidgetImage(params).promise();
// MetricWidgetImage đã là Buffer/base64, không cần convert
const blob = new Blob([response.MetricWidgetImage], { type: 'image/png' });
const imageUrl = URL.createObjectURL(blob);
```

## 5. AWS SDK Version Issues

### Khuyến nghị sử dụng AWS SDK v3:
```javascript
import { CloudWatchClient, GetMetricWidgetImageCommand } from '@aws-sdk/client-cloudwatch';

const client = new CloudWatchClient({ region: 'ap-southeast-1' });
const command = new GetMetricWidgetImageCommand({
    MetricWidget: JSON.stringify(widgetConfig),
    OutputFormat: 'png'
});

const response = await client.send(command);
```

## Giải Pháp Được Đề Xuất

### Phương Án 1: AWS CLI (Khuyến nghị)
```bash
#!/bin/bash
# Script để generate chart
WIDGET_JSON='{
  "view": "timeSeries",
  "stacked": false,
  "metrics": [["AWS/EC2", "CPUUtilization", "InstanceId", "i-0b7c8d02813c56a21"]],
  "width": 600,
  "height": 400,
  "start": "-PT3H",
  "end": "PT0H",
  "period": 300,
  "stat": "Average"
}'

aws cloudwatch get-metric-widget-image \
    --region ap-southeast-1 \
    --metric-widget "$WIDGET_JSON" \
    --output-format png \
    --output text | base64 --decode > cpu_chart.png

echo "Chart exported to cpu_chart.png"
```

### Phương Án 2: Server-side với Node.js
```javascript
// server.js
const AWS = require('aws-sdk');
const express = require('express');
const app = express();

const cloudwatch = new AWS.CloudWatch({ region: 'ap-southeast-1' });

app.post('/export-chart', async (req, res) => {
    try {
        const { widgetConfig } = req.body;
        
        // Ensure required fields
        const completeConfig = {
            view: 'timeSeries',
            stacked: false,
            ...widgetConfig
        };
        
        const params = {
            MetricWidget: JSON.stringify(completeConfig),
            OutputFormat: 'png'
        };
        
        const response = await cloudwatch.getMetricWidgetImage(params).promise();
        
        res.set({
            'Content-Type': 'image/png',
            'Content-Disposition': 'attachment; filename="chart.png"'
        });
        
        res.send(response.MetricWidgetImage);
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

### Phương Án 3: Lambda + API Gateway
```python
# lambda_function.py
import json
import boto3
import base64

def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event['body'])
        widget_config = body['widgetConfig']
        
        # Ensure required fields
        if 'view' not in widget_config:
            widget_config['view'] = 'timeSeries'
        if 'stacked' not in widget_config:
            widget_config['stacked'] = False
            
        # Create CloudWatch client
        cloudwatch = boto3.client('cloudwatch')
        
        # Call GetMetricWidgetImage
        response = cloudwatch.get_metric_widget_image(
            MetricWidget=json.dumps(widget_config),
            OutputFormat='png'
        )
        
        # Return base64 encoded image
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'image/png',
                'Access-Control-Allow-Origin': '*'
            },
            'body': base64.b64encode(response['MetricWidgetImage']).decode('utf-8'),
            'isBase64Encoded': True
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## Testing & Debugging

### 1. Test JSON Configuration
```bash
# Test với AWS CLI trước
aws cloudwatch get-metric-widget-image \
    --region ap-southeast-1 \
    --metric-widget '{"view":"timeSeries","metrics":[["AWS/EC2","CPUUtilization","InstanceId","i-0b7c8d02813c56a21"]]}' \
    --output-format png \
    --output text | base64 --decode > test.png
```

### 2. Check IAM Permissions
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudwatch:GetMetricWidgetImage",
                "cloudwatch:ListMetrics",
                "cloudwatch:GetMetricData"
            ],
            "Resource": "*"
        }
    ]
}
```

### 3. Debug Browser Console
```javascript
// Check CORS errors
console.log('Making CloudWatch request...');
try {
    const response = await cloudwatch.getMetricWidgetImage(params).promise();
    console.log('Success:', response);
} catch (error) {
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
}
```

## Kết Luận

**Khuyến nghị sử dụng AWS CLI** cho reliability và simplicity. Browser-based solutions có nhiều hạn chế về CORS, authentication và security.

Nếu cần web interface, hãy tạo server-side API để proxy requests đến CloudWatch thay vì gọi trực tiếp từ browser.