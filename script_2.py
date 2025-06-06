import json

# Tạo example config files
example_configs = {
    'rds_multi_metrics_config.json': {
        "view": "timeSeries",
        "stacked": False,
        "metrics": [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "mydb-instance"],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeableMemory", ".", "."]
        ],
        "width": 800,
        "height": 400,
        "start": "-PT6H",
        "end": "PT0H",
        "period": 300,
        "stat": "Average",
        "title": "RDS Multi-Metrics Dashboard"
    }
}

for filename, config in example_configs.items():
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)
    print(f"✅ Đã tạo example config: {filename}")

# Tạo usage guide
usage_guide = """
# CloudWatch Exporter Usage Guide

## Script Python (Khuyến nghị cho automation)

### 1. Cài đặt dependencies:
```bash
pip install boto3
```

### 2. Cấu hình AWS credentials:
```bash
aws configure
# Nhập Access Key ID, Secret Key, Region
```

### 3. Sử dụng script:

#### Export EC2 CPU chart:
```bash
python cloudwatch_exporter.py --region ap-southeast-1 --instance-id i-0b7c8d02813c56a21
```

#### Export RDS connections:
```bash
python cloudwatch_exporter.py --region ap-southeast-1 --db-instance mydb-instance
```

#### Export từ config file:
```bash
python cloudwatch_exporter.py --config ec2_cpu_config.json --output my_chart.png
```

## AWS CLI (Fastest method)

### Template command:
```bash
aws cloudwatch get-metric-widget-image \\
    --region YOUR_REGION \\
    --metric-widget '{"view":"timeSeries","stacked":false,"metrics":[["NAMESPACE","METRIC","DIMENSION_NAME","DIMENSION_VALUE"]],"width":600,"height":400,"start":"-PT3H","end":"PT0H","period":300,"stat":"Average"}' \\
    --output-format png \\
    --output text | base64 --decode > chart.png
```

### Examples:

#### EC2 CPU:
```bash
aws cloudwatch get-metric-widget-image \\
    --region ap-southeast-1 \\
    --metric-widget '{"view":"timeSeries","metrics":[["AWS/EC2","CPUUtilization","InstanceId","i-0b7c8d02813c56a21"]]}' \\
    --output-format png \\
    --output text | base64 --decode > ec2_cpu.png
```

#### RDS Connections:
```bash
aws cloudwatch get-metric-widget-image \\
    --region ap-southeast-1 \\
    --metric-widget '{"view":"timeSeries","metrics":[["AWS/RDS","DatabaseConnections","DBInstanceIdentifier","mydb-instance"]]}' \\
    --output-format png \\
    --output text | base64 --decode > rds_connections.png
```

## Automation với Shell Script

### Tạo script tự động export multiple charts:
```bash
#!/bin/bash
# auto_export.sh

REGION="ap-southeast-1"
OUTPUT_DIR="charts_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUTPUT_DIR"

# EC2 instances
INSTANCES=("i-0b7c8d02813c56a21" "i-1234567890abcdef0")
for instance in "${INSTANCES[@]}"; do
    echo "Exporting CPU chart for $instance..."
    python cloudwatch_exporter.py --region $REGION --instance-id $instance --output "$OUTPUT_DIR/cpu_$instance.png"
done

# RDS instances  
DBS=("mydb-instance" "prod-db")
for db in "${DBS[@]}"; do
    echo "Exporting connections chart for $db..."
    python cloudwatch_exporter.py --region $REGION --db-instance $db --output "$OUTPUT_DIR/connections_$db.png"
done

echo "All charts exported to $OUTPUT_DIR/"
```

## Troubleshooting

### Common errors và solutions:

1. **"No credentials found"**
   ```bash
   aws configure
   # hoặc set environment variables:
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   export AWS_DEFAULT_REGION=ap-southeast-1
   ```

2. **"ValidationError: MetricWidget property has bad JSON content"**
   - Đảm bảo JSON có trường "view": "timeSeries"
   - Check JSON syntax với tool online

3. **"UnauthorizedOperation"**
   - IAM user cần permission: cloudwatch:GetMetricWidgetImage
   - Check IAM policy

4. **Empty hoặc error image**
   - Check metric name và dimension values đúng chưa
   - Verify resource tồn tại trong region specified
"""

with open('usage_guide.md', 'w', encoding='utf-8') as f:
    f.write(usage_guide)

print("✅ Đã tạo usage_guide.md")
print()
print("📊 TẤT CẢ FILES ĐÃ TẠO:")
print("1. cloudwatch_exporter.py - Python script chính")
print("2. ec2_cpu_config.json - Example config cho EC2")  
print("3. rds_multi_metrics_config.json - Example config cho RDS")
print("4. usage_guide.md - Hướng dẫn sử dụng chi tiết")
print("5. cloudwatch-fix-guide.md - Hướng dẫn sửa lỗi technical")
print("6. Web app: cloudwatch-exporter-fixed")
print()
print("🎯 KHUYẾN NGHỊ WORKFLOW:")
print("1. Dùng AWS CLI để test nhanh")
print("2. Dùng Python script cho automation") 
print("3. Dùng web app cho demo/UI needs")
print()
print("⚠️  LƯU Ý: Browser-based solutions có giới hạn về CORS và security.")
print("   AWS CLI và server-side scripts sẽ reliable hơn.")