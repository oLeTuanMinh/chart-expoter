# Tạo dữ liệu về các AWS namespaces và metrics phổ biến
import json

# Dữ liệu về các namespace và metrics phổ biến trong CloudWatch
cloudwatch_data = {
    "namespaces": [
        {
            "namespace": "AWS/EC2",
            "description": "Amazon Elastic Compute Cloud",
            "common_metrics": [
                "CPUUtilization",
                "NetworkIn",
                "NetworkOut", 
                "DiskReadOps",
                "DiskWriteOps",
                "DiskReadBytes",
                "DiskWriteBytes"
            ],
            "dimensions": ["InstanceId", "ImageId", "InstanceType"]
        },
        {
            "namespace": "AWS/RDS",
            "description": "Amazon Relational Database Service", 
            "common_metrics": [
                "CPUUtilization",
                "DatabaseConnections",
                "FreeableMemory",
                "FreeStorageSpace",
                "ReadIOPS",
                "WriteIOPS"
            ],
            "dimensions": ["DBInstanceIdentifier", "DBClusterIdentifier"]
        },
        {
            "namespace": "AWS/Lambda",
            "description": "AWS Lambda Functions",
            "common_metrics": [
                "Invocations",
                "Duration", 
                "Errors",
                "Throttles",
                "DeadLetterErrors",
                "ConcurrentExecutions"
            ],
            "dimensions": ["FunctionName", "Resource"]
        },
        {
            "namespace": "AWS/ApplicationELB",
            "description": "Application Load Balancer",
            "common_metrics": [
                "RequestCount",
                "TargetResponseTime",
                "HTTPCode_Target_2XX_Count",
                "HTTPCode_Target_4XX_Count",
                "HTTPCode_Target_5XX_Count"
            ],
            "dimensions": ["LoadBalancer", "TargetGroup"]
        },
        {
            "namespace": "AWS/S3",
            "description": "Amazon Simple Storage Service",
            "common_metrics": [
                "BucketSizeBytes",
                "NumberOfObjects",
                "AllRequests",
                "GetRequests",
                "PutRequests"
            ],
            "dimensions": ["BucketName", "StorageType"]
        },
        {
            "namespace": "AWS/ECS",
            "description": "Amazon Elastic Container Service",
            "common_metrics": [
                "CPUUtilization",
                "MemoryUtilization",
                "RunningTaskCount",
                "PendingTaskCount"
            ],
            "dimensions": ["ServiceName", "ClusterName"]
        }
    ]
}

# Lưu dữ liệu thành JSON file
with open('cloudwatch_namespaces.json', 'w', encoding='utf-8') as f:
    json.dump(cloudwatch_data, f, indent=2, ensure_ascii=False)

print("✅ Đã tạo file cloudwatch_namespaces.json")

# Hiển thị một phần dữ liệu
for ns in cloudwatch_data["namespaces"][:3]:
    print(f"\n📊 {ns['namespace']} - {ns['description']}")
    print(f"   Metrics: {', '.join(ns['common_metrics'][:3])}...")
    print(f"   Dimensions: {', '.join(ns['dimensions'])}")