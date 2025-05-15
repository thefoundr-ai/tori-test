// /home/ubuntu/phoenixflow_backend/services/excelExporter.js

// This is a mock implementation for demonstrating the structure and logic.
// A real implementation would use a Node.js Excel library like exceljs or xlsx-populate.
const fs = require("fs");
const path = require("path");

/**
 * Simulates creating an Excel file and writing data to it.
 * @param {string} filePath - The path where the Excel file will be saved.
 * @param {object} workbookData - An object containing sheet names as keys and 2D arrays of data as values.
 * @param {string} brandingText - Text for branding.
 * @returns {Promise<void>}
 */
async function createAndWriteWorkbook(filePath, workbookData, brandingText) {
    console.log(`[MockExcelExporter] Creating Excel file at: ${filePath}`);
    console.log(`[MockExcelExporter] Branding: ${brandingText}`);
    
    let fileContent = `Excel File: ${path.basename(filePath)}\nBranding: ${brandingText}\n\n`;

    for (const sheetName in workbookData) {
        fileContent += `--- Sheet: ${sheetName} ---\n`;
        const sheetData = workbookData[sheetName];
        // Log a snippet of the data for mock purposes
        for(let i = 0; i < Math.min(sheetData.length, 5); i++) {
            fileContent += sheetData[i].slice(0, 5).join("\t") + "\n";
        }
        fileContent += "\n";
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(filePath);
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(filePath, fileContent); // Write mock content to a file
    console.log(`[MockExcelExporter] Mock Excel file content written to ${filePath}`);
    await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Generates an Excel file with financial model data.
 * @param {object} financialModelData - Data from financialModelEngine.
 * @param {object} valuationData - Data from valuationEngine.
 * @param {object} compsData - Data from compsEngine.
 * @param {object} inputs - Original user inputs/assumptions.
 * @param {string} mode - "founder" or "investor".
 * @param {string} userId - The user ID for naming.
 * @returns {Promise<string>} Path to the generated Excel file.
 */
async function generateExcelFile(financialModelData, valuationData, compsData, inputs, mode, userId) {
    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const fileName = `PhoenixFlow_Model_${userId}_${mode}_${timestamp}.xlsx`;
    const outputDirectory = "/home/ubuntu/phoenixflow_backend/output"; // Define an output directory
    const filePath = path.join(outputDirectory, fileName);
    const branding = "TheFoundr.AI | Powered by PhoenixFlow";

    const workbookContent = {};

    // --- Sheet 1: Assumptions ---
    const assumptionsSheetData = [];
    assumptionsSheetData.push([branding]);
    assumptionsSheetData.push(["Input Assumptions"]);
    assumptionsSheetData.push([]); // Spacer
    if (inputs.assumptions.revenueGrowthRate) {
        inputs.assumptions.revenueGrowthRate.forEach((rate, idx) => {
            assumptionsSheetData.push([`Year ${idx + 1} Revenue Growth Rate`, rate]);
        });
    }
    if (inputs.assumptions.cogsAsPercentageOfRevenue) {
         inputs.assumptions.cogsAsPercentageOfRevenue.forEach((rate, idx) => {
            assumptionsSheetData.push([`Year ${idx + 1} COGS % Revenue`, rate]);
        });
    }
    assumptionsSheetData.push(["WACC", inputs.valuationAssumptions.wacc]);
    if(inputs.valuationAssumptions.terminalValueMethod === "gordonGrowth"){
        assumptionsSheetData.push(["Terminal Growth Rate", inputs.valuationAssumptions.terminalGrowthRate]);
    }
     if(inputs.valuationAssumptions.terminalValueMethod === "exitMultiple"){
        assumptionsSheetData.push(["Exit Multiple", inputs.valuationAssumptions.exitMultiple]);
    }
    workbookContent["Assumptions"] = assumptionsSheetData;

    // --- Sheet 2: Income Statement ---
    const incomeStatementSheetData = [];
    incomeStatementSheetData.push([branding]);
    incomeStatementSheetData.push(["Income Statement"]);
    const isHeader = ["Metric"];
    financialModelData.incomeStatement.years.forEach((_, idx) => isHeader.push(`Year ${idx + 1}`));
    incomeStatementSheetData.push(isHeader);
    for (const key in financialModelData.incomeStatement.years[0]) {
        const row = [key];
        financialModelData.incomeStatement.years.forEach(yearData => row.push(yearData[key]));
        incomeStatementSheetData.push(row);
    }
    workbookContent["Income Statement"] = incomeStatementSheetData;

    // --- Sheet 3: Balance Sheet ---
    const balanceSheetData = [];
    balanceSheetData.push([branding]);
    balanceSheetData.push(["Balance Sheet"]);
    const bsHeader = ["Metric"];
    financialModelData.balanceSheet.years.forEach((_, idx) => bsHeader.push(`Year ${idx + 1}`));
    balanceSheetData.push(bsHeader);
     for (const key in financialModelData.balanceSheet.years[0]) {
        const row = [key];
        financialModelData.balanceSheet.years.forEach(yearData => row.push(yearData[key]));
        balanceSheetData.push(row);
    }
    workbookContent["Balance Sheet"] = balanceSheetData;

    // --- Sheet 4: Cash Flow Statement ---
    const cfsData = [];
    cfsData.push([branding]);
    cfsData.push(["Cash Flow Statement"]);
    const cfsHeader = ["Metric"];
    financialModelData.cashFlowStatement.years.forEach((_, idx) => cfsHeader.push(`Year ${idx + 1}`));
    cfsData.push(cfsHeader);
    for (const key in financialModelData.cashFlowStatement.years[0]) {
        const row = [key];
        financialModelData.cashFlowStatement.years.forEach(yearData => row.push(yearData[key]));
        cfsData.push(row);
    }
    workbookContent["Cash Flow Statement"] = cfsData;

    // --- Sheet 5: DCF Valuation ---
    const dcfSheetData = [];
    dcfSheetData.push([branding]);
    dcfSheetData.push(["DCF Valuation Summary"]);
    dcfSheetData.push(["Enterprise Value", valuationData.enterpriseValue]);
    dcfSheetData.push(["Equity Value", valuationData.equityValue]);
    // ... add more DCF details
    workbookContent["DCF Valuation"] = dcfSheetData;

    // --- Sheet 6: Comps Analysis (if data exists) ---
    if (compsData && compsData.detailedComps && compsData.detailedComps.length > 0) {
        const compsSheetData = [];
        compsSheetData.push([branding]);
        compsSheetData.push(["Comparable Company Analysis"]);
        const compsHeader = Object.keys(compsData.detailedComps[0]);
        compsSheetData.push(compsHeader);
        compsData.detailedComps.forEach(comp => {
            const row = compsHeader.map(header => comp[header]);
            compsSheetData.push(row);
        });
        // ... add summary multiples
        workbookContent["Comps Analysis"] = compsSheetData;
    }

    await createAndWriteWorkbook(filePath, workbookContent, branding);
    console.log(`[MockExcelExporter] Successfully generated mock Excel file: ${filePath}`);
    return filePath;
}

module.exports = {
    generateExcelFile,
};
