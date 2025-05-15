// /home/ubuntu/phoenixflow_backend/sample_api_requests_outputs.md

# Sample API Requests and Outputs

This document provides sample API request bodies and expected JSON responses for the `/api/generateModel` endpoint. These samples cover both "Founder" and "Investor" modes.

## Founder Mode

### Sample Request (Founder Mode)

```json
{
  "user_id": "founder_user_001",
  "mode": "founder",
  "inputs": {
    "assumptions": {
      "baseRevenue": 500000,
      "revenueGrowthRate": [0.15, 0.12, 0.10, 0.08, 0.05],
      "cogsAsPercentageOfRevenue": [0.65, 0.64, 0.63, 0.62, 0.62],
      "sgaAsPercentageOfRevenue": [0.20, 0.19, 0.18, 0.18, 0.17],
      "taxRate": 0.21,
      "sharesOutstanding": 50000
    },
    "valuationAssumptions": {
      "wacc": 0.12,
      "terminalValueMethod": "exitMultiple",
      "exitMultiple": 7,
      "exitMultipleMetric": "EBITDA"
    }
    // historicalData and comparableCompanies are optional for founder mode
  }
}
```

### Sample Response (Founder Mode - Mocked URLs)

```json
{
  "message": "Financial model generated successfully.",
  "googleSheetUrl": "https://docs.google.com/spreadsheets/d/mock_sheet_id_founder_timestamp/edit",
  "excelDownloadUrl": "https://firebasestorage.googleapis.com/v0/b/mock-project.appspot.com/o/users%2Ffounder_user_001%2Fmodels%2FPhoenixFlow_Model_founder_user_001_founder_timestamp.xlsx?alt=media&token=mock-token",
  "summary": {
    "estimatedEnterpriseValue": 1234567.89, // Example value
    "estimatedEquityValue": 1000000.00, // Example value
    "equityValuePerShare": 20.00, // Example value (1,000,000 / 50,000)
    "irr": "IRR_calculation_placeholder",
    "npv": 1234567.89,
    "keyValuationMultiples": {
      "dcfExitMultiple": {
        "metric": "EBITDA",
        "value": 7
      }
    },
    "coreAssumptions": {
      "wacc": 0.12,
      "terminalValueMethod": "exitMultiple",
      "exitMultiple": 7,
      "exitMultipleMetric": "EBITDA",
      "projectionYears": 5
    },
    "keyProjectedFinancials": {
      "firstYearRevenue": 575000, // Example: 500000 * 1.15
      "firstYearEbitda": 86250,  // Example: 575000 * (1 - 0.65 - 0.20)
      "lastYearRevenue": 785000, // Example value
      "lastYearEbitda": 150000  // Example value
    },
    "generationMode": "founder",
    "generatedAt": "2025-05-14T19:14:51.000Z" // Example timestamp
  },
  "firebaseDocId": "model_output_founder_user_001_timestamp"
}
```

## Investor Mode

### Sample Request (Investor Mode)

```json
{
  "user_id": "investor_user_002",
  "mode": "investor",
  "inputs": {
    "assumptions": {
      "baseRevenue": 2000000,
      "revenueGrowthRate": [0.20, 0.18, 0.15, 0.12, 0.10],
      "cogsAsPercentageOfRevenue": [0.50, 0.49, 0.48, 0.48, 0.47],
      "sgaAsPercentageOfRevenue": [0.15, 0.14, 0.13, 0.12, 0.12],
      "rdAsPercentageOfRevenue": [0.05, 0.05, 0.04, 0.04, 0.03],
      "depreciationAsPercentageOfRevenue": [0.04, 0.04, 0.045, 0.045, 0.05],
      "capexAsPercentageOfRevenue": [0.06, 0.06, 0.055, 0.055, 0.05],
      "taxRate": 0.25,
      "interestRateOnDebt": 0.04,
      "accountsReceivableAsPercentageOfSales": 0.1232876712328767, // 45 days
      "inventoryAsPercentageOfCOGS": 0.1643835616438356, // 60 days
      "accountsPayableAsPercentageOfCOGS": 0.1095890410958904, // 40 days
      "sharesOutstanding": 1000000,
      "baseDebt": 500000,
      "baseCash": 200000
    },
    "valuationAssumptions": {
      "wacc": 0.09,
      "terminalValueMethod": "gordonGrowth",
      "terminalGrowthRate": 0.025
    },
    "historicalData": {
      "incomeStatement": { "revenue": 1800000, "depreciationAndAmortization": 70000 },
      "balanceSheet": { "cash": 180000, "totalDebt": 450000, "ppeNet": 900000, "retainedEarnings": 600000, "commonStock": 400000 }
    },
    "comparableCompanies": [
      {
        "companyName": "Global Corp Inc.",
        "enterpriseValue": 50000000,
        "ltmRevenue": 10000000,
        "ltmEbitda": 2500000,
        "ltmNetIncome": 1200000,
        "marketCap": 48000000
      },
      {
        "companyName": "Innovate Ltd.",
        "enterpriseValue": 75000000,
        "ltmRevenue": 15000000,
        "ltmEbitda": 3500000,
        "ltmNetIncome": 1800000,
        "marketCap": 70000000
      }
    ]
  }
}
```

### Sample Response (Investor Mode - Mocked URLs)

```json
{
  "message": "Financial model generated successfully.",
  "googleSheetUrl": "https://docs.google.com/spreadsheets/d/mock_sheet_id_investor_timestamp/edit",
  "excelDownloadUrl": "https://firebasestorage.googleapis.com/v0/b/mock-project.appspot.com/o/users%2Finvestor_user_002%2Fmodels%2FPhoenixFlow_Model_investor_user_002_investor_timestamp.xlsx?alt=media&token=mock-token",
  "summary": {
    "estimatedEnterpriseValue": 25000000.00, // Example value
    "estimatedEquityValue": 22000000.00, // Example value
    "equityValuePerShare": 22.00, // Example value (22,000,000 / 1,000,000)
    "irr": "IRR_calculation_placeholder",
    "npv": 25000000.00,
    "keyValuationMultiples": {},
    "coreAssumptions": {
      "wacc": 0.09,
      "terminalValueMethod": "gordonGrowth",
      "terminalGrowthRate": 0.025,
      "projectionYears": 5
    },
    "keyProjectedFinancials": {
      "firstYearRevenue": 2160000, // Example: 1800000 * 1.20 (using historical as base)
      "firstYearEbitda": 648000,  // Example value
      "lastYearRevenue": 3500000, // Example value
      "lastYearEbitda": 1200000  // Example value
    },
    "comparableCompanySummary": {
        "evToRevenue": { "mean": 5.0, "median": 5.0, "high": 5.0, "low": 5.0 }, // Example
        "evToEbitda": { "mean": 20.0, "median": 20.0, "high": 20.0, "low": 20.0 } // Example
    },
    "generationMode": "investor",
    "generatedAt": "2025-05-14T19:14:51.000Z" // Example timestamp
  },
  "firebaseDocId": "model_output_investor_user_002_timestamp"
}
```

**Note:** The actual numerical values in the sample responses (e.g., `estimatedEnterpriseValue`, `keyProjectedFinancials`) are illustrative and would be dynamically calculated by the backend based on the provided inputs and the implemented financial logic. The URLs and timestamps are also placeholders.

