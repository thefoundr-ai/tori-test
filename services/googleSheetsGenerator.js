// /home/ubuntu/phoenixflow_backend/services/googleSheetsGenerator.js

// This is a mock implementation for demonstrating the structure and logic.
// A real implementation would use the Google Sheets API (e.g., googleapis library).

/**
 * Simulates creating a new Google Sheet and returning a mock URL.
 * @param {string} title - The title for the new Google Sheet.
 * @returns {Promise<string>} A mock URL for the created sheet.
 */
async function createNewSheet(title) {
    console.log(`[MockGoogleSheets] Creating new sheet titled: ${title}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100)); 
    const mockSheetId = `mock_sheet_id_${Date.now()}`;
    return `https://docs.google.com/spreadsheets/d/${mockSheetId}/edit`;
}

/**
 * Simulates writing data and formulas to a sheet.
 * @param {string} spreadsheetId - The ID of the spreadsheet.
 * @param {string} sheetName - The name of the sheet within the spreadsheet.
 * @param {Array<Array<any>>} data - 2D array of data/formulas to write.
 * @param {string} brandingText - Text for branding.
 */
async function writeToSheet(spreadsheetId, sheetName, data, brandingText) {
    console.log(`[MockGoogleSheets] Writing data to sheet: ${sheetName} in ${spreadsheetId}`);
    console.log(`[MockGoogleSheets] Branding: ${brandingText}`);
    // In a real implementation, this would involve batchUpdate requests to the Google Sheets API
    // to set values, formulas, formatting, and branding.
    
    // For mock purposes, we can log a snippet of the data
    console.log("[MockGoogleSheets] Sample data to write:");
    for(let i = 0; i < Math.min(data.length, 5); i++) {
        console.log(data[i].slice(0, 5).join("\t"));
    }
    await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Generates a Google Sheet with financial model data.
 * @param {object} financialModelData - Data from financialModelEngine.
 * @param {object} valuationData - Data from valuationEngine.
 * @param {object} compsData - Data from compsEngine.
 * @param {object} inputs - Original user inputs/assumptions.
 * @param {string} mode - "founder" or "investor".
 * @param {string} userId - The user ID for naming/permissions.
 * @returns {Promise<string>} URL of the generated Google Sheet.
 */
async function generateGoogleSheet(financialModelData, valuationData, compsData, inputs, mode, userId) {
    const sheetTitle = `PhoenixFlow Model - ${userId} - ${mode.charAt(0).toUpperCase() + mode.slice(1)} - ${new Date().toISOString().split('T')[0]}`;
    const branding = "TheFoundr.AI | Powered by PhoenixFlow";

    const spreadsheetUrl = await createNewSheet(sheetTitle);
    const spreadsheetId = spreadsheetUrl.split("/d/")[1].split("/")[0]; // Extract mock ID

    // --- Sheet 1: Assumptions ---
    const assumptionsSheetData = [];
    assumptionsSheetData.push([branding]);
    assumptionsSheetData.push(["Input Assumptions"]);
    assumptionsSheetData.push([]); // Spacer
    // Example: Revenue Growth Rate (editable)
    // In a real sheet, these would be input cells that other formulas reference.
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
    // ... Add all other relevant assumptions from inputs.assumptions and inputs.valuationAssumptions
    assumptionsSheetData.push(["WACC", inputs.valuationAssumptions.wacc]);
    if(inputs.valuationAssumptions.terminalValueMethod === "gordonGrowth"){
        assumptionsSheetData.push(["Terminal Growth Rate", inputs.valuationAssumptions.terminalGrowthRate]);
    }
    if(inputs.valuationAssumptions.terminalValueMethod === "exitMultiple"){
        assumptionsSheetData.push(["Exit Multiple", inputs.valuationAssumptions.exitMultiple]);
    }
    await writeToSheet(spreadsheetId, "Assumptions", assumptionsSheetData, branding);

    // --- Sheet 2: Income Statement ---
    const incomeStatementSheetData = [];
    incomeStatementSheetData.push([branding]);
    incomeStatementSheetData.push(["Income Statement"]);
    const isHeader = ["Metric"];
    financialModelData.incomeStatement.years.forEach((_, idx) => isHeader.push(`Year ${idx + 1}`));
    incomeStatementSheetData.push(isHeader);
    for (const key in financialModelData.incomeStatement.years[0]) {
        const row = [key];
        financialModelData.incomeStatement.years.forEach(yearData => {
            // In a real sheet, these would be formulas referencing the Assumptions sheet and other IS/BS/CFS cells.
            // For mock, we just put the calculated value.
            row.push(yearData[key]); 
        });
        incomeStatementSheetData.push(row);
    }
    await writeToSheet(spreadsheetId, "Income Statement", incomeStatementSheetData, branding);

    // --- Sheet 3: Balance Sheet ---
    const balanceSheetData = [];
    balanceSheetData.push([branding]);
    balanceSheetData.push(["Balance Sheet"]);
    const bsHeader = ["Metric"];
    financialModelData.balanceSheet.years.forEach((_, idx) => bsHeader.push(`Year ${idx + 1}`));
    balanceSheetData.push(bsHeader);
     for (const key in financialModelData.balanceSheet.years[0]) {
        const row = [key];
        financialModelData.balanceSheet.years.forEach(yearData => {
            row.push(yearData[key]);
        });
        balanceSheetData.push(row);
    }
    await writeToSheet(spreadsheetId, "Balance Sheet", balanceSheetData, branding);

    // --- Sheet 4: Cash Flow Statement ---
    const cfsData = [];
    cfsData.push([branding]);
    cfsData.push(["Cash Flow Statement"]);
    const cfsHeader = ["Metric"];
    financialModelData.cashFlowStatement.years.forEach((_, idx) => cfsHeader.push(`Year ${idx + 1}`));
    cfsData.push(cfsHeader);
    for (const key in financialModelData.cashFlowStatement.years[0]) {
        const row = [key];
        financialModelData.cashFlowStatement.years.forEach(yearData => {
            row.push(yearData[key]);
        });
        cfsData.push(row);
    }
    await writeToSheet(spreadsheetId, "Cash Flow Statement", cfsData, branding);

    // --- Sheet 5: DCF Valuation ---
    const dcfSheetData = [];
    dcfSheetData.push([branding]);
    dcfSheetData.push(["DCF Valuation Summary"]);
    dcfSheetData.push(["Enterprise Value", valuationData.enterpriseValue]);
    dcfSheetData.push(["Equity Value", valuationData.equityValue]);
    dcfSheetData.push(["Terminal Value", valuationData.terminalValue]);
    dcfSheetData.push(["NPV", valuationData.npv]);
    dcfSheetData.push(["IRR", valuationData.irr]); // Placeholder from engine
    dcfSheetData.push(["WACC", valuationData.wacc]);
    // ... add FCFFs per year etc.
    await writeToSheet(spreadsheetId, "DCF Valuation", dcfSheetData, branding);

    // --- Sheet 6: Comps Analysis (if data exists) ---
    if (compsData && compsData.detailedComps && compsData.detailedComps.length > 0) {
        const compsSheetData = [];
        compsSheetData.push([branding]);
        compsSheetData.push(["Comparable Company Analysis"]);
        // Headers for comps table
        const compsHeader = Object.keys(compsData.detailedComps[0]);
        compsSheetData.push(compsHeader);
        compsData.detailedComps.forEach(comp => {
            const row = compsHeader.map(header => comp[header]);
            compsSheetData.push(row);
        });
        compsSheetData.push([]); // Spacer
        compsSheetData.push(["Summary Multiples"]);
        for(const metric in compsData.summaryMetrics){
            compsSheetData.push([metric, "Mean", "Median", "High", "Low"]);
            const stats = compsData.summaryMetrics[metric];
            compsSheetData.push(["", stats.mean, stats.median, stats.high, stats.low]);
        }
        await writeToSheet(spreadsheetId, "Comps Analysis", compsSheetData, branding);
    }

    console.log(`[MockGoogleSheets] Successfully generated mock Google Sheet: ${spreadsheetUrl}`);
    return spreadsheetUrl;
}

module.exports = {
    generateGoogleSheet,
};
