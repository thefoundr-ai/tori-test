// /home/ubuntu/phoenixflow_backend/test_spreadsheet_generation.js

const { processInputs } = require("./core/inputProcessor");
const { generateThreeStatementModel } = require("./core/financialModelEngine");
const { generateDCFValuation } = require("./core/valuationEngine");
const { generateCompsAnalysis } = require("./core/compsEngine");
const { generateGoogleSheet } = require("./services/googleSheetsGenerator"); // Mocked
const { generateExcelFile } = require("./services/excelExporter"); // Mocked

async function runSpreadsheetGenerationTest() {
    console.log("--- Starting Spreadsheet Generation Test (Mocked) ---");

    const rawInputsInvestor = {
        assumptions: {
            baseRevenue: 1500000,
            revenueGrowthRate: [0.15, 0.12, 0.10, 0.08, 0.06],
            cogsAsPercentageOfRevenue: [0.50, 0.50, 0.51, 0.51, 0.52],
            sgaAsPercentageOfRevenue: [0.16, 0.15, 0.14, 0.14, 0.13],
            rdAsPercentageOfRevenue: [0.05, 0.05, 0.04, 0.04, 0.03], // Investor mode might have R&D
            depreciationAsPercentageOfRevenue: [0.04, 0.04, 0.045, 0.045, 0.05], // Required for investor
            capexAsPercentageOfRevenue: [0.05, 0.05, 0.055, 0.055, 0.06], // Required for investor
            taxRate: 0.23, // Specific tax rate for investor
            interestRateOnDebt: 0.045, // Required for investor
            accountsReceivableAsPercentageOfSales: 45/365, // Required for investor (e.g. 45 DSO)
            inventoryAsPercentageOfCOGS: 60/365, // Required for investor (e.g. 60 DIO)
            accountsPayableAsPercentageOfCOGS: 40/365, // Required for investor (e.g. 40 DPO)
            sharesOutstanding: 250000
        },
        valuationAssumptions: {
            wacc: 0.09,
            terminalValueMethod: "exitMultiple",
            exitMultiple: 10,
            exitMultipleMetric: "EBITDA",
            // terminalGrowthRate: 0.02 // Not required if exitMultiple
        },
        historicalData: { // More detailed historical data might be expected for investor
            incomeStatement: { revenue: 1300000, depreciationAndAmortization: 50000, cogs: 680000, sga: 200000, rd: 60000, interestExpense: 20000, taxes: 70000, netIncome: 220000 },
            balanceSheet: { cash: 150000, accountsReceivable: 160000, inventory: 100000, ppeNet: 700000, totalDebt: 300000, accountsPayable: 80000, commonStock: 200000, retainedEarnings: 330000 }
        },
        comparableCompanies: [
            { companyName: "Comp X", enterpriseValue: 12000000, ltmRevenue: 2500000, ltmEbitda: 1200000, ltmNetIncome: 600000, marketCap: 11000000 },
            { companyName: "Comp Y", enterpriseValue: 18000000, ltmRevenue: 3500000, ltmEbitda: 1800000, ltmNetIncome: 900000, marketCap: 16000000 },
        ]
    };

    const mode = "investor"; 
    const userId = "investorUser789";
    const projectionYears = 5;

    console.log(`\n--- Testing with mode: ${mode} ---`);
    console.log("\n--- 1. Processing Inputs ---");
    const processedInputs = processInputs(rawInputsInvestor, mode);
    if (processedInputs.errors && processedInputs.errors.length > 0) {
        console.error("Input processing errors:", processedInputs.errors);
        // If there are errors, we should not proceed with this test case for generation
        console.log("--- Spreadsheet Generation Test (Mocked) Failed due to input errors ---");
        return; 
    }

    console.log("\n--- 2. Generating 3-Statement Model ---");
    const financialModel = generateThreeStatementModel(processedInputs, mode, projectionYears);

    console.log("\n--- 3. Generating DCF Valuation ---");
    const valuationResults = generateDCFValuation(financialModel, processedInputs, mode);

    console.log("\n--- 4. Generating Comps Analysis ---");
    const compsAnalysis = generateCompsAnalysis(rawInputsInvestor.comparableCompanies, mode);

    console.log("\n--- 5. Generating Mock Google Sheet ---");
    try {
        const googleSheetUrl = await generateGoogleSheet(financialModel, valuationResults, compsAnalysis, processedInputs, mode, userId);
        console.log(`Mock Google Sheet URL: ${googleSheetUrl}`);
        console.log("Review console logs from googleSheetsGenerator.js for details on what would be written.");
    } catch (error) {
        console.error("Error generating mock Google Sheet:", error);
    }

    console.log("\n--- 6. Generating Mock Excel File ---");
    try {
        const excelFilePath = await generateExcelFile(financialModel, valuationResults, compsAnalysis, processedInputs, mode, userId);
        console.log(`Mock Excel File Path: ${excelFilePath}`);
        console.log("Review the mock file content and console logs from excelExporter.js.");
    } catch (error) {
        console.error("Error generating mock Excel file:", error);
    }

    console.log("\n--- Spreadsheet Generation Test (Mocked) Completed ---");
    console.log("This test simulates the calls to spreadsheet generation modules with investor mode inputs.");
    console.log("With real libraries, the next step would be to open the generated files and test interactivity.");
}

runSpreadsheetGenerationTest();
