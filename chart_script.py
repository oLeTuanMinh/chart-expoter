import plotly.graph_objects as go
import pandas as pd

# Create the data
data = [
    {
        "Method": "AWS CLI",
        "Ease of Use": 4,
        "Reliability": 5,
        "Security": 5,
        "Automation Friendly": 5,
        "Setup Complexity": 2
    },
    {
        "Method": "Python Script",
        "Ease of Use": 3,
        "Reliability": 5,
        "Security": 5,
        "Automation Friendly": 5,
        "Setup Complexity": 3
    },
    {
        "Method": "Browser App (Original)",
        "Ease of Use": 2,
        "Reliability": 1,
        "Security": 2,
        "Automation Friendly": 1,
        "Setup Complexity": 4
    },
    {
        "Method": "Browser App (Fixed)",
        "Ease of Use": 3,
        "Reliability": 3,
        "Security": 3,
        "Automation Friendly": 2,
        "Setup Complexity": 4
    }
]

df = pd.DataFrame(data)

# Create the figure
fig = go.Figure()

# Define colors (using brand colors in order)
colors = ['#1FB8CD', '#FFC185', '#ECEBD5', '#5D878F', '#D2BA4C']

# Define the metrics to plot (numeric only)
metrics = ['Ease of Use', 'Reliability', 'Security', 'Automation Friendly', 'Setup Complexity']
metric_abbrev = ['Ease of Use', 'Reliability', 'Security', 'Automation', 'Setup Complex']

# Shorten method names to fit 15 char limit
method_names = ['AWS CLI', 'Python Script', 'Browser (Orig)', 'Browser (Fix)']

# Add bars for each metric
for i, metric in enumerate(metrics):
    fig.add_trace(go.Bar(
        x=method_names,
        y=df[metric],
        name=metric_abbrev[i],
        marker_color=colors[i],
        cliponaxis=False,
        text=df[metric],
        textposition='outside'
    ))

# Update layout
fig.update_layout(
    title='CloudWatch Export Methods Comparison',
    xaxis_title='Method',
    yaxis_title='Rating (1-5)',
    barmode='group',
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Update axes
fig.update_xaxes()
fig.update_yaxes(range=[0, 6])

# Save the chart
fig.write_image('cloudwatch_methods_comparison.png')