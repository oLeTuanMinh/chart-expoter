import plotly.graph_objects as go
import pandas as pd

# Create the data
data = [
    {"step": "User Input", "order": 1, "description": "AWS creds,\nnamespace &\nmetrics", "color": "#1FB8CD"},
    {"step": "Validate Config", "order": 2, "description": "Check creds\n& parameters", "color": "#FFC185"},  
    {"step": "Build Widget JSON", "order": 3, "description": "Create\nMetricWidget\nconfig", "color": "#ECEBD5"},
    {"step": "Call API", "order": 4, "description": "GetMetricWidget\nImage API call", "color": "#5D878F"},
    {"step": "Process Response", "order": 5, "description": "Decode base64\nimage data", "color": "#D2BA4C"},
    {"step": "Download PNG", "order": 6, "description": "Save file to\nuser device", "color": "#B4413C"}
]

df = pd.DataFrame(data)

# Create vertical flowchart
fig = go.Figure()

# Add rectangles for each step using shapes
y_positions = [6, 5, 4, 3, 2, 1]  # Top to bottom

for i, row in df.iterrows():
    y_pos = y_positions[i]
    
    # Add rectangle shape
    fig.add_shape(
        type="rect",
        x0=0.5, y0=y_pos-0.3, x1=2.5, y1=y_pos+0.3,
        fillcolor=row['color'],
        line=dict(color="#13343B", width=2)
    )
    
    # Add step text
    fig.add_trace(go.Scatter(
        x=[1.5],
        y=[y_pos],
        mode='text',
        text=[f"<b>{row['step']}</b><br>{row['description']}"],
        textfont=dict(size=12, color='black'),
        showlegend=False,
        cliponaxis=False
    ))

# Add connecting arrows between steps
for i in range(len(df)-1):
    y_start = y_positions[i] - 0.3
    y_end = y_positions[i+1] + 0.3
    
    # Vertical connecting line
    fig.add_trace(go.Scatter(
        x=[1.5, 1.5],
        y=[y_start, y_end],
        mode='lines',
        line=dict(color='#13343B', width=3),
        showlegend=False,
        cliponaxis=False
    ))
    
    # Arrow head
    fig.add_trace(go.Scatter(
        x=[1.5],
        y=[y_end + 0.1],
        mode='markers',
        marker=dict(
            symbol='triangle-down',
            size=12,
            color='#13343B'
        ),
        showlegend=False,
        cliponaxis=False
    ))

# Update layout
fig.update_layout(
    title="CloudWatch Chart Export Workflow",
    xaxis=dict(visible=False, range=[0, 3]),
    yaxis=dict(visible=False, range=[0.5, 6.5]),
    plot_bgcolor='white'
)

# Save the chart
fig.write_image("workflow_chart.png")