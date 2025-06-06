#!/usr/bin/env python3
"""
AWS CloudWatch Chart Exporter
Script Python đơn giản để export biểu đồ CloudWatch thành file PNG

Usage:
    python cloudwatch_exporter.py --region ap-southeast-1 --instance-id i-0b7c8d02813c56a21
    python cloudwatch_exporter.py --config custom_config.json
"""

import boto3
import json
import argparse
import base64
from datetime import datetime
import os
import sys

class CloudWatchExporter:
    def __init__(self, region='ap-southeast-1'):
        self.region = region
        self.cloudwatch = boto3.client('cloudwatch', region_name=region)

    def create_widget_config(self, namespace, metric_name, dimension_name, dimension_value, 
                           start_time="-PT3H", end_time="PT0H", period=300, stat="Average"):
        """Tạo widget configuration với tất cả trường bắt buộc"""
        return {
            "view": "timeSeries",  # BẮT BUỘC!
            "stacked": False,
            "metrics": [[namespace, metric_name, dimension_name, dimension_value]],
            "width": 600,
            "height": 400,
            "start": start_time,
            "end": end_time,
            "period": period,
            "stat": stat,
            "region": self.region,
            "title": f"{metric_name} - {dimension_value}"
        }

    def export_chart(self, widget_config, output_file=None):
        """Export biểu đồ từ CloudWatch"""
        try:
            # Ensure required fields
            if 'view' not in widget_config:
                widget_config['view'] = 'timeSeries'

            print(f"📊 Exporting chart với config:")
            print(json.dumps(widget_config, indent=2))

            # Call CloudWatch API
            response = self.cloudwatch.get_metric_widget_image(
                MetricWidget=json.dumps(widget_config),
                OutputFormat='png'
            )

            # Save to file
            if not output_file:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_file = f"cloudwatch_chart_{timestamp}.png"

            with open(output_file, 'wb') as f:
                f.write(response['MetricWidgetImage'])

            print(f"✅ Chart đã được xuất ra: {output_file}")
            print(f"📁 File size: {len(response['MetricWidgetImage'])} bytes")

            return output_file

        except Exception as e:
            print(f"❌ Lỗi khi export chart: {str(e)}")
            return None

    def export_ec2_cpu(self, instance_id, output_file=None):
        """Export CPU utilization chart cho EC2 instance"""
        config = self.create_widget_config(
            namespace="AWS/EC2",
            metric_name="CPUUtilization",
            dimension_name="InstanceId",
            dimension_value=instance_id
        )
        return self.export_chart(config, output_file)

    def export_rds_connections(self, db_instance_id, output_file=None):
        """Export database connections chart cho RDS"""
        config = self.create_widget_config(
            namespace="AWS/RDS",
            metric_name="DatabaseConnections",
            dimension_name="DBInstanceIdentifier",
            dimension_value=db_instance_id
        )
        return self.export_chart(config, output_file)

    def export_lambda_invocations(self, function_name, output_file=None):
        """Export invocations chart cho Lambda function"""
        config = self.create_widget_config(
            namespace="AWS/Lambda",
            metric_name="Invocations",
            dimension_name="FunctionName",
            dimension_value=function_name,
            stat="Sum"  # Lambda invocations thường dùng Sum
        )
        return self.export_chart(config, output_file)

def load_config_from_file(config_file):
    """Load widget configuration từ JSON file"""
    try:
        with open(config_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Không thể load config từ {config_file}: {str(e)}")
        return None

def main():
    parser = argparse.ArgumentParser(description='AWS CloudWatch Chart Exporter')
    parser.add_argument('--region', default='ap-southeast-1', help='AWS region')
    parser.add_argument('--config', help='JSON config file path')
    parser.add_argument('--instance-id', help='EC2 Instance ID cho CPU chart')
    parser.add_argument('--db-instance', help='RDS DB Instance ID cho connections chart')
    parser.add_argument('--lambda-function', help='Lambda Function Name cho invocations chart')
    parser.add_argument('--output', help='Output file name')

    args = parser.parse_args()

    # Check AWS credentials
    try:
        boto3.Session().get_credentials()
    except Exception as e:
        print("❌ AWS credentials không được cấu hình đúng cách.")
        print("Vui lòng chạy: aws configure")
        sys.exit(1)

    exporter = CloudWatchExporter(region=args.region)

    if args.config:
        # Load từ config file
        config = load_config_from_file(args.config)
        if config:
            exporter.export_chart(config, args.output)
    elif args.instance_id:
        # Export EC2 CPU chart
        exporter.export_ec2_cpu(args.instance_id, args.output)
    elif args.db_instance:
        # Export RDS connections chart
        exporter.export_rds_connections(args.db_instance, args.output)
    elif args.lambda_function:
        # Export Lambda invocations chart
        exporter.export_lambda_invocations(args.lambda_function, args.output)
    else:
        print("❌ Vui lòng cung cấp một trong các option: --config, --instance-id, --db-instance, --lambda-function")
        parser.print_help()

if __name__ == "__main__":
    main()
