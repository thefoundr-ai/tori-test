// /home/ubuntu/phoenixflow_backend/test_model_validation.js

const { processInputs } = require("./core/inputProcessor");
const { generateThreeStatementModel } = require("./core/financialModelEngine");
const { generateDCFValuation } = require("./core/valuationEngine");
const { generateCompsAnalysis } = require("./core/compsEngine"); // Will use mock data for comps
const { generateSummaryOutput } = require("./core/summaryGenerator");

async function runValidationTest() {
    console.log("--- Starting Model Validation Test ---");

    const rawInputs = {
        assumptions: {
            baseRevenue: 1000000,
            // Using mostly defaults from founder mode schema in inputProcessor for simplicity
            // revenueGrowthRate: [0.1, 0.08, 0.05, 0.03, 0.03], // Default
            // cogsAsPercentageOfRevenue: [0.6, 0.6, 0.6, 0.6, 0.6], // Default
            // sgaAsPercentageOfRevenue: [0.15, 0.15, 0.14, 0.14, 0.13], // Default
            taxRate: 0.21, // Default
            sharesOutstanding: 100000 // Added for per share value testing
        },
        valuationAssumptions: {
            wacc: 0.10, // Default for founder
            terminalValueMethod: "exitMultiple", // Default for founder
            exitMultiple: 8, // Default for founder
            // terminalGrowthRate: 0.02 // Not used if exitMultiple is default
        },
        historicalData: { // Minimal historical data for testing base value propagation
            // incomeStatement: { revenue: 900000, depreciationAndAmortization: 25000 },
            // balanceSheet: { cash: 90000, totalDebt: 45000, ppeNet: 180000, totalEquity: 225000, retainedEarnings: 40000, commonStock: 90000 }
        },
        // Mock Comps Data
        comparableCompanies: [
            { companyName: "Comp A", enterpriseValue: 10000000, ltmRevenue: 2000000, ltmEbitda: 1000000, ltmNetIncome: 500000, marketCap: 9000000 },
            { companyName: "Comp B", enterpriseValue: 15000000, ltmRevenue: 3000000, ltmEbitda: 1500000, ltmNetIncome: 750000, marketCap: 13000000 },
        ]
    };

    const mode = "founder";
    const projectionYears = 5;

    console.log("\n--- 1. Processing Inputs ---");
    const processedInputs = processInputs(rawInputs, mode);
    if (processedInputs.errors && processedInputs.errors.length > 0) {
        console.error("Input processing errors:", processedInputs.errors);
        return;
    }
    console.log("Processed Assumptions:", JSON.stringify(processedInputs.assumptions, null, 2));
    console.log("Processed Valuation Assumptions:", JSON.stringify(processedInputs.valuationAssumptions, null, 2));

    console.log("\n--- 2. Generating 3-Statement Model ---");
    const financialModel = generateThreeStatementModel(processedInputs, mode, projectionYears);
    // Log some key metrics from the 3-statement model
    console.log("Year 1 Revenue:", financialModel.incomeStatement.years[0].revenue);
    console.log("Year 1 Net Income:", financialModel.incomeStatement.years[0].netIncome);
    console.log("Year 5 Ending Cash:", financialModel.cashFlowStatement.years[4].endingCashBalance);
    console.log("Year 5 Balance Sheet Check (should be close to 0):", financialModel.balanceSheet.years[4].balanceSheetCheck);

    console.log("\n--- 3. Generating DCF Valuation ---");
    const valuationResults = generateDCFValuation(financialModel, processedInputs, mode);
    console.log("Enterprise Value (DCF):", valuationResults.enterpriseValue);
    console.log("Equity Value (DCF):", valuationResults.equityValue);
    console.log("Terminal Value:", valuationResults.terminalValue);
    console.log("FCFF Year 1:", valuationResults.fcffs[0]);

    console.log("\n--- 4. Generating Comps Analysis ---");
    const compsAnalysis = generateCompsAnalysis(rawInputs.comparableCompanies, mode);
    console.log("Comps Summary EV/EBITDA Median:", compsAnalysis.summaryMetrics.evToEbitda ? compsAnalysis.summaryMetrics.evToEbitda.median : "N/A");

    console.log("\n--- 5. Generating Summary Output ---");
    const summaryOutput = generateSummaryOutput(valuationResults, financialModel, processedInputs, mode);
    console.log("Structured Summary:", JSON.stringify(summaryOutput, null, 2));

    console.log("\n--- Model Validation Test Completed ---");
    console.log("Review the logged outputs to compare against expected values based on Excel logic.");
    console.log("Key areas for manual/conceptual validation:");
    console.log("- Revenue growth and margin calculations in Income Statement.");
    console.log("- Balance Sheet linkages (Cash from CFS, Retained Earnings from Net Income). Ensure BS balances.");
    console.log("- Cash Flow Statement calculations (CFO from Net Income & D&A & WC changes, CFI from CapEx, CFF - simplified for now).");
    console.log("- FCFF calculation based on IS and CFS items.");
    console.log("- Terminal Value and Enterprise Value calculations in DCF.");
    console.log("- Consistency of assumptions used in summary vs. model calculations.");

}

runValidationTest();
