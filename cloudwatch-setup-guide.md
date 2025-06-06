# Hướng Dẫn Sử Dụng CloudWatch Chart Exporter

## Tổng Quan

Ứng dụng **CloudWatch Chart Exporter** là một công cụ web giúp bạn export các biểu đồ từ AWS CloudWatch thành file ảnh PNG một cách dễ dàng. Ứng dụng sử dụng AWS SDK JavaScript và CloudWatch API để tạo ra các biểu đồ từ metrics data.

## Yêu Cầu Hệ Thống

### AWS Permissions Cần Thiết

Để sử dụng ứng dụng, bạn cần có IAM user hoặc role với các quyền sau:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricWidgetImage",
        "cloudwatch:ListMetrics",
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics"
      ],
      "Resource": "*"
    }
  ]
}
```

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Hướng Dẫn Sử Dụng

### Bước 1: Cấu Hình AWS Credentials

1. Mở ứng dụng và điền thông tin AWS:
   - **Access Key ID**: Access key của IAM user
   - **Secret Access Key**: Secret key của IAM user  
   - **Region**: Chọn AWS region chứa resources bạn muốn monitor

2. Click "Test Connection" để kiểm tra kết nối (trong demo mode)

### Bước 2: Chọn Metrics

1. **Namespace**: Chọn AWS service namespace (ví dụ: AWS/EC2, AWS/RDS)
2. **Metric Name**: Chọn metric cụ thể (ví dụ: CPUUtilization)
3. **Dimensions**: Nhập dimensions theo format `Key=Value` (ví dụ: `InstanceId=i-1234567890abcdef0`)
4. **Time Range**: Chọn start time và end time
5. **Statistic**: Chọn loại statistic (Average, Sum, Maximum, etc.)
6. **Period**: Chọn period (300s - 3600s)
7. **Chart Title**: Nhập tiêu đề cho biểu đồ

### Bước 3: Preview và Export

1. Click "Generate Preview" để xem JSON configuration
2. Review và edit JSON nếu cần
3. Click "Export Chart" để tạo biểu đồ
4. Đợi quá trình tạo biểu đồ hoàn thành
5. Click "Download PNG" để tải file về

### Bước 4: Sử Dụng Templates

Ứng dụng cung cấp các template có sẵn:
- **EC2 CPU Utilization**: Monitor CPU usage của EC2 instances
- **RDS Database Connections**: Monitor số lượng connections tới RDS
- **Lambda Invocations**: Monitor số lần invoke Lambda functions

Click vào template để load cấu hình có sẵn.

## Các Namespace Phổ Biến

### AWS/EC2 - Elastic Compute Cloud
- **CPUUtilization**: Phần trăm CPU usage
- **NetworkIn/NetworkOut**: Network traffic in/out bytes
- **DiskReadOps/DiskWriteOps**: Disk I/O operations
- **DiskReadBytes/DiskWriteBytes**: Disk I/O bytes

### AWS/RDS - Relational Database Service  
- **CPUUtilization**: Database CPU usage
- **DatabaseConnections**: Số lượng connections
- **FreeableMemory**: Memory khả dụng
- **ReadIOPS/WriteIOPS**: Database I/O operations

### AWS/Lambda - Lambda Functions
- **Invocations**: Số lần invoke function
- **Duration**: Thời gian execute (ms)
- **Errors**: Số lượng errors
- **Throttles**: Số lần bị throttle

### AWS/ApplicationELB - Application Load Balancer
- **RequestCount**: Số lượng requests
- **TargetResponseTime**: Response time
- **HTTPCode_Target_2XX_Count**: Successful responses
- **HTTPCode_Target_4XX_Count**: Client errors

### AWS/S3 - Simple Storage Service
- **BucketSizeBytes**: Dung lượng bucket
- **NumberOfObjects**: Số lượng objects
- **AllRequests**: Tổng số requests
- **GetRequests/PutRequests**: GET/PUT requests

## Troubleshooting

### Lỗi Authentication
- Kiểm tra Access Key ID và Secret Access Key
- Đảm bảo IAM user có đủ permissions
- Kiểm tra region đã chọn đúng

### Lỗi Metrics Không Tìm Thấy
- Đảm bảo namespace và metric name đúng
- Kiểm tra dimensions format: `Key=Value`
- Đảm bảo resource tồn tại trong region đã chọn

### Lỗi Export Chart
- Kiểm tra time range không quá dài (tối đa 15 ngày)
- Đảm bảo có data trong time range đã chọn
- Kiểm tra network connection

## API Rate Limits

AWS CloudWatch có các giới hạn:
- **GetMetricWidgetImage**: 20 requests/second
- **ListMetrics**: 25 requests/second
- **GetMetricData**: 50 requests/second

## Best Practices

1. **Cache Configuration**: Sử dụng Local Storage để lưu cấu hình
2. **Batch Export**: Export nhiều charts cùng lúc nếu cần
3. **Time Range**: Chọn time range phù hợp với purpose
4. **Period**: Sử dụng period lớn hơn cho time range dài
5. **Dimensions**: Sử dụng wildcard (*) để monitor nhiều resources

## Ví Dụ JSON Configuration

```json
{
  "title": "EC2 CPU Utilization",
  "view": "timeSeries",
  "stacked": false,
  "metrics": [
    ["AWS/EC2", "CPUUtilization", "InstanceId", "i-1234567890abcdef0"]
  ],
  "period": 300,
  "stat": "Average",
  "region": "us-east-1",
  "start": "-PT3H",
  "end": "PT0H",
  "width": 1200,
  "height": 600
}
```

## Support

Nếu gặp vấn đề, vui lòng tham khảo:
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [GetMetricWidgetImage API Reference](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_GetMetricWidgetImage.html)
- [CloudWatch Metrics and Dimensions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/aws-services-cloudwatch-metrics.html)