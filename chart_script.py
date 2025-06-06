import plotly.express as px
import json
import pandas as pd

# Create the data from the provided JSON
data = [
  {"namespace": "AWS/EC2", "metric_count": 7, "description": "Amazon Elastic Compute Cloud"},
  {"namespace": "AWS/RDS", "metric_count": 6, "description": "Amazon Relational Database Service"},  
  {"namespace": "AWS/Lambda", "metric_count": 6, "description": "AWS Lambda Functions"},
  {"namespace": "AWS/ApplicationELB", "metric_count": 5, "description": "Application Load Balancer"},
  {"namespace": "AWS/S3", "metric_count": 5, "description": "Amazon Simple Storage Service"},
  {"namespace": "AWS/ECS", "metric_count": 4, "description": "Amazon Elastic Container Service"}
]

# Convert to DataFrame
df = pd.DataFrame(data)

# Define brand colors
colors = ['#1FB8CD', '#FFC185', '#ECEBD5', '#5D878F', '#D2BA4C', '#B4413C']

# Create bar chart
fig = px.bar(df, 
             x='namespace', 
             y='metric_count',
             title='AWS CloudWatch - Common Metrics by Namespace',
             color='namespace',
             color_discrete_sequence=colors)

# Update layout following instructions
fig.update_layout(
    xaxis_title='Namespace',
    yaxis_title='Metric Count',
    showlegend=False  # Remove legend since color just represents different namespaces
)

# Update axes
fig.update_xaxes(tickangle=45)

# Apply cliponaxis=False to traces
fig.update_traces(cliponaxis=False)

# Save the chart
fig.write_image('aws_cloudwatch_metrics.png')