---
name: data-analyzer
description: Analyze datasets and generate insights with visualizations when user needs statistical analysis, data exploration, or reporting from structured data
---

# Data Analyzer

## Overview

This skill processes data files, performs statistical analysis, and generates visualizations following analytical best practices. It handles exploratory data analysis, hypothesis testing, and automated reporting from structured datasets.

## When to Use This Skill

Claude should invoke this skill when:
- User uploads CSV, Excel, or JSON data for analysis
- Requests for statistical summaries or data insights
- Need to generate charts or visualizations from data
- Comparing datasets or time series analysis
- Creating data-driven reports or dashboards

## Instructions

### Data Loading and Validation

1. **Load Data**
   - Read file using appropriate parser (CSV, Excel, JSON)
   - Handle encoding issues (try UTF-8, then fallbacks)
   - Parse dates and numeric columns correctly

2. **Initial Validation**
   - Check for missing values and report percentage
   - Identify data types for each column
   - Detect outliers using IQR or z-scores
   - Report basic statistics (rows, columns, memory usage)

3. **Data Quality Assessment**
   - Check for duplicates
   - Validate value ranges (e.g., no negative ages)
   - Identify potential data entry errors
   - Flag inconsistent categories or typos

### Analysis Process

1. **Exploratory Data Analysis (EDA)**
   - Generate descriptive statistics (mean, median, std dev)
   - Create distribution plots for numeric columns
   - Analyze correlations between variables
   - Identify patterns and trends

2. **Apply Analysis Methodology**
   - For time series: trend, seasonality, anomalies
   - For categorical data: frequency tables, cross-tabs
   - For numeric data: distributions, correlations, clusters
   - For comparisons: statistical tests (t-test, ANOVA, chi-square)

3. **Generate Visualizations**
   - Choose appropriate chart types:
     * Line charts for time series
     * Bar charts for categorical comparisons
     * Scatter plots for relationships
     * Histograms for distributions
     * Box plots for outliers and ranges
   - Use clear titles, labels, and legends
   - Apply consistent color schemes
   - Include sample sizes in annotations

4. **Summarize Findings**
   - Key insights in bullet points
   - Statistical significance where applicable
   - Recommendations based on data
   - Caveats and limitations

### Quality Standards

- Always visualize distributions before aggregating
- Test assumptions (normality, homoscedasticity)
- Report effect sizes, not just p-values
- Handle missing data transparently
- Document all data transformations

## Examples

### Example 1: Sales Data Analysis

**Input:**
```
Analyze sales_data.csv and tell me:
1. Top performing products
2. Seasonal trends
3. Regional performance
```

**Output:**
```
Analysis Results:

Top Performing Products:
1. Product A: $2.4M (32% of total)
2. Product B: $1.8M (24% of total)
3. Product C: $1.2M (16% of total)

Seasonal Trends:
- Peak sales in Q4 (holiday season): +45% vs Q2
- Lowest sales in Q1: -22% vs annual average
- Consistent growth trend: +15% year-over-year

Regional Performance:
- West region leads with $3.2M (42%)
- East region growing fastest: +28% YoY
- South region underperforming: -8% YoY

[Includes: 3 visualizations (bar chart, line chart, heatmap)]
[Statistical tests: ANOVA p<0.01 for regional differences]

Recommendations:
1. Increase Q1 promotions to offset seasonal dip
2. Investigate South region decline
3. Expand successful West region strategies
```

### Example 2: Customer Survey Analysis

**Input:**
```
Analyze customer_satisfaction.csv
Focus on factors driving satisfaction scores
```

**Output:**
```
Customer Satisfaction Analysis (n=1,247 responses)

Overall Satisfaction: 7.2/10 (±1.8 SD)

Key Drivers (Correlation Analysis):
1. Response Time: r=0.68** (strongest predictor)
2. Product Quality: r=0.54**
3. Price Perception: r=0.42**
4. Support Experience: r=0.39**
(**p<0.01)

Segment Analysis:
- New customers (0-6 months): 6.8/10
- Established customers (6+ months): 7.6/10
- Difference significant: t=4.2, p<0.001

Risk Factors:
- 23% of respondents scored ≤5 (at-risk)
- Primary complaints: slow response (67%), pricing (34%)

[Includes: Scatter plot matrix, box plots by segment, word cloud from comments]

Recommendations:
1. Prioritize response time improvements
2. Implement proactive outreach for new customers
3. Review pricing strategy for at-risk segments
```

## Guidelines

### Statistical Best Practices
- Report confidence intervals with point estimates
- Use appropriate statistical tests for data type
- Correct for multiple comparisons when needed
- Don't confuse correlation with causation
- Check and report statistical power

### Visualization Best Practices
- Avoid 3D charts and pie charts with many slices
- Start y-axis at zero for bar charts
- Use colorblind-friendly palettes
- Limit to 5-7 colors per visualization
- Export at high resolution (300 DPI minimum)

### Data Handling
- Never modify raw data files
- Document all cleaning steps
- Handle missing data appropriately (don't just drop)
- Preserve data lineage for audit trail
- Respect data privacy and anonymize if needed

### Reporting Standards
- Executive summary (1 paragraph)
- Methodology section
- Results with visualizations
- Limitations and caveats
- Actionable recommendations

## File Locations

- Analysis scripts: `scripts/analyze.py`
- Visualization templates: `scripts/visualize.py`
- Statistical tests: `scripts/stats_tests.py`
- Example datasets: `resources/examples/`
- Output templates: `resources/templates/`

## Dependencies

- pandas>=1.5.0 (data manipulation)
- numpy>=1.23.0 (numerical operations)
- matplotlib>=3.5.0 (basic plotting)
- seaborn>=0.12.0 (statistical visualizations)
- scipy>=1.9.0 (statistical tests)
- statsmodels>=0.13.0 (advanced statistics)

## Common Analysis Types

### Time Series Analysis
1. Decompose into trend, seasonal, residual
2. Test for stationarity (ADF test)
3. Identify anomalies (isolation forest, z-scores)
4. Forecast if requested (ARIMA, Prophet)

### A/B Test Analysis
1. Check sample sizes are adequate
2. Test for balance in covariates
3. Calculate effect size and confidence intervals
4. Perform statistical test (t-test, Mann-Whitney)
5. Check for multiple testing issues

### Cohort Analysis
1. Define cohorts by signup date or other metric
2. Track metrics over time for each cohort
3. Visualize retention curves
4. Compare cohort performance

## Additional Resources

- See REFERENCE.md for statistical test selection guide
- Check resources/viz-guide.md for visualization examples
- Review scripts/example_analysis.ipynb for workflow examples

---
*Created: 2025-11-11*
*Version: 1.0.0*
*Dependencies: python>=3.8, pandas>=1.5.0, numpy>=1.23.0, matplotlib>=3.5.0, seaborn>=0.12.0, scipy>=1.9.0*
