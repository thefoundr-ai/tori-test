// /home/ubuntu/phoenixflow_backend/core/financialModelEngine.js
const { applyGrowth, calculatePercentageOf } = require("../utils/financialUtils");

/**
 * Generates the 3-statement financial model.
 * @param {object} inputs - The validated input assumptions.
 * @param {string} mode - "founder" or "investor".
 * @param {number} projectionYears - Number of years to project.
 * @returns {object} The generated 3-statement model (Income Statement, Balance Sheet, Cash Flow).
 */
function generateThreeStatementModel(inputs, mode, projectionYears = 5) {
    const historical = inputs.historicalData || {}; // Assuming historical data might be provided
    const assumptions = inputs.assumptions;

    // Initialize structures for IS, BS, CF for each projected year
    const incomeStatement = { years: [] };
    const balanceSheet = { years: [] };
    const cashFlowStatement = { years: [] };

    // --- Helper function to get previous year actual or projection ---
    const getPreviousYearValue = (statement, itemName, yearIndex) => {
        if (yearIndex === 0) { // First projection year, use historical
            return historical[statement] && historical[statement][itemName] ? historical[statement][itemName] : 0;
        }
        // Use previous projected year
        const prevStatementYear = statement === "IS" ? incomeStatement.years[yearIndex - 1] :
                                statement === "BS" ? balanceSheet.years[yearIndex - 1] :
                                cashFlowStatement.years[yearIndex - 1];
        return prevStatementYear && prevStatementYear[itemName] ? prevStatementYear[itemName] : 0;
    };

    for (let i = 0; i < projectionYears; i++) {
        const currentYearIS = {};
        const currentYearBS = {};
        const currentYearCFS = {};

        // --- Income Statement Calculations ---
        if (i === 0 && historical.incomeStatement && historical.incomeStatement.revenue) {
            currentYearIS.revenue = applyGrowth(historical.incomeStatement.revenue, assumptions.revenueGrowthRate[i]);
        } else if (i > 0) {
            currentYearIS.revenue = applyGrowth(incomeStatement.years[i-1].revenue, assumptions.revenueGrowthRate[i]);
        } else {
             // Handle case where no historical revenue and it's the first year - might need a base assumption
            currentYearIS.revenue = assumptions.baseRevenue ? applyGrowth(assumptions.baseRevenue, assumptions.revenueGrowthRate[i]) : 0;
        }

        currentYearIS.cogs = calculatePercentageOf(currentYearIS.revenue, assumptions.cogsAsPercentageOfRevenue[i]);
        currentYearIS.grossProfit = currentYearIS.revenue - currentYearIS.cogs;

        currentYearIS.sga = calculatePercentageOf(currentYearIS.revenue, assumptions.sgaAsPercentageOfRevenue[i]);
        currentYearIS.rd = calculatePercentageOf(currentYearIS.revenue, assumptions.rdAsPercentageOfRevenue ? assumptions.rdAsPercentageOfRevenue[i] : 0); // R&D might be optional
        currentYearIS.otherOperatingExpenses = calculatePercentageOf(currentYearIS.revenue, assumptions.otherOpExAsPercentageOfRevenue ? assumptions.otherOpExAsPercentageOfRevenue[i] : 0);
        
        currentYearIS.operatingExpenses = currentYearIS.sga + currentYearIS.rd + currentYearIS.otherOperatingExpenses;
        currentYearIS.ebitda = currentYearIS.grossProfit - currentYearIS.operatingExpenses;

        // D&A - this will need a supporting schedule or simpler assumption for now
        // For simplicity, let's assume D&A is a % of revenue or a fixed growth from historical
        const prevDA = getPreviousYearValue("IS", "depreciationAndAmortization", i);
        currentYearIS.depreciationAndAmortization = assumptions.depreciationAsPercentageOfRevenue ? 
                                                calculatePercentageOf(currentYearIS.revenue, assumptions.depreciationAsPercentageOfRevenue[i]) :
                                                applyGrowth(prevDA || assumptions.baseDA || 0, assumptions.depreciationGrowthRate ? assumptions.depreciationGrowthRate[i] : 0.05); // Default D&A growth if not specified
        
        currentYearIS.ebit = currentYearIS.ebitda - currentYearIS.depreciationAndAmortization;

        // Interest Expense - needs debt schedule
        // For now, assume a % of debt or a fixed value based on mode
        const prevDebt = getPreviousYearValue("BS", "totalDebt", i);
        currentYearIS.interestExpense = calculatePercentageOf(prevDebt || assumptions.baseDebt || 0, assumptions.interestRateOnDebt || 0.05);

        currentYearIS.earningsBeforeTax = currentYearIS.ebit - currentYearIS.interestExpense;
        currentYearIS.taxes = calculatePercentageOf(currentYearIS.earningsBeforeTax > 0 ? currentYearIS.earningsBeforeTax : 0, assumptions.taxRate);
        currentYearIS.netIncome = currentYearIS.earningsBeforeTax - currentYearIS.taxes;

        incomeStatement.years.push(currentYearIS);

        // --- Balance Sheet Calculations (Placeholder - requires more complex linking) ---
        // Cash (will be linked from CFS)
        currentYearBS.cash = 0; // Placeholder
        currentYearBS.accountsReceivable = calculatePercentageOf(currentYearIS.revenue, assumptions.accountsReceivableAsPercentageOfSales || (30/365)); // DSO/365
        currentYearBS.inventory = calculatePercentageOf(currentYearIS.cogs, assumptions.inventoryAsPercentageOfCOGS || (45/365)); // DIO/365
        currentYearBS.totalCurrentAssets = currentYearBS.cash + currentYearBS.accountsReceivable + currentYearBS.inventory;

        // PP&E - needs CapEx and D&A
        const prevPPE = getPreviousYearValue("BS", "ppeNet", i);
        const capex = calculatePercentageOf(currentYearIS.revenue, assumptions.capexAsPercentageOfRevenue ? assumptions.capexAsPercentageOfRevenue[i] : 0.03); // Example CapEx
        currentYearBS.ppeNet = (prevPPE || assumptions.basePPENet || 0) + capex - currentYearIS.depreciationAndAmortization;
        currentYearBS.totalNonCurrentAssets = currentYearBS.ppeNet;
        currentYearBS.totalAssets = currentYearBS.totalCurrentAssets + currentYearBS.totalNonCurrentAssets;

        currentYearBS.accountsPayable = calculatePercentageOf(currentYearIS.cogs, assumptions.accountsPayableAsPercentageOfCOGS || (30/365)); // DPO/365
        currentYearBS.totalCurrentLiabilities = currentYearBS.accountsPayable; // Add short-term debt etc.
        
        // Debt - needs debt schedule
        currentYearBS.longTermDebt = prevDebt || assumptions.baseDebt || 0; // Simplified: debt stays constant unless explicitly changed by CFF
        currentYearBS.totalLiabilities = currentYearBS.totalCurrentLiabilities + currentYearBS.longTermDebt;

        // Equity
        const prevEquity = getPreviousYearValue("BS", "totalEquity", i);
        currentYearBS.commonStock = getPreviousYearValue("BS", "commonStock", i) || assumptions.baseCommonStock || 0;
        currentYearBS.retainedEarnings = (prevEquity ? getPreviousYearValue("BS", "retainedEarnings", i) : (assumptions.baseRetainedEarnings || 0)) + currentYearIS.netIncome; // Simplified, ignoring dividends for now
        currentYearBS.totalEquity = currentYearBS.commonStock + currentYearBS.retainedEarnings;
        currentYearBS.totalLiabilitiesAndEquity = currentYearBS.totalLiabilities + currentYearBS.totalEquity;

        // Balance Sheet Check (placeholder for now, cash is the plug)
        currentYearBS.balanceSheetCheck = currentYearBS.totalAssets - currentYearBS.totalLiabilitiesAndEquity;

        balanceSheet.years.push(currentYearBS);

        // --- Cash Flow Statement Calculations (Placeholder) ---
        currentYearCFS.netIncome = currentYearIS.netIncome;
        currentYearCFS.depreciationAndAmortization = currentYearIS.depreciationAndAmortization;
        
        const prevAR = getPreviousYearValue("BS", "accountsReceivable", i);
        const prevInventory = getPreviousYearValue("BS", "inventory", i);
        const prevAP = getPreviousYearValue("BS", "accountsPayable", i);

        currentYearCFS.changeInAccountsReceivable = currentYearBS.accountsReceivable - prevAR;
        currentYearCFS.changeInInventory = currentYearBS.inventory - prevInventory;
        currentYearCFS.changeInAccountsPayable = currentYearBS.accountsPayable - prevAP;
        currentYearCFS.changeInWorkingCapital = -(currentYearCFS.changeInAccountsReceivable + currentYearCFS.changeInInventory) + currentYearCFS.changeInAccountsPayable;

        currentYearCFS.cashFlowFromOperations = currentYearCFS.netIncome + currentYearCFS.depreciationAndAmortization + currentYearCFS.changeInWorkingCapital;
        
        currentYearCFS.capitalExpenditures = -capex;
        currentYearCFS.cashFlowFromInvesting = currentYearCFS.capitalExpenditures;

        // CFF (Simplified: no new debt/equity, no dividends)
        currentYearCFS.debtRaisedOrRepaid = 0;
        currentYearCFS.equityRaisedOrRepaid = 0;
        currentYearCFS.dividendsPaid = 0;
        currentYearCFS.cashFlowFromFinancing = currentYearCFS.debtRaisedOrRepaid + currentYearCFS.equityRaisedOrRepaid - currentYearCFS.dividendsPaid;

        currentYearCFS.netChangeInCash = currentYearCFS.cashFlowFromOperations + currentYearCFS.cashFlowFromInvesting + currentYearCFS.cashFlowFromFinancing;
        const beginningCash = getPreviousYearValue("BS", "cash", i) || assumptions.baseCash || 0;
        currentYearCFS.endingCashBalance = beginningCash + currentYearCFS.netChangeInCash;

        cashFlowStatement.years.push(currentYearCFS);

        // Link ending cash to BS
        balanceSheet.years[i].cash = currentYearCFS.endingCashBalance;
        // Recalculate BS totals with actual cash
        balanceSheet.years[i].totalCurrentAssets = balanceSheet.years[i].cash + balanceSheet.years[i].accountsReceivable + balanceSheet.years[i].inventory;
        balanceSheet.years[i].totalAssets = balanceSheet.years[i].totalCurrentAssets + balanceSheet.years[i].totalNonCurrentAssets;
        balanceSheet.years[i].balanceSheetCheck = balanceSheet.years[i].totalAssets - balanceSheet.years[i].totalLiabilitiesAndEquity;
    }

    return {
        incomeStatement,
        balanceSheet,
        cashFlowStatement,
    };
}

module.exports = {
    generateThreeStatementModel,
};
