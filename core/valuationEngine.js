// /home/ubuntu/phoenixflow_backend/core/valuationEngine.js
const { calculatePercentageOf } = require("../utils/financialUtils");

/**
 * Calculates Free Cash Flow to Firm (FCFF).
 * @param {object} incomeStatementYear - A single year object from the income statement projection.
 * @param {object} cashFlowStatementYear - A single year object from the cash flow statement projection.
 * @param {object} assumptions - Valuation assumptions including tax rate.
 * @returns {number} Calculated FCFF for the year.
 */
function calculateFCFF(incomeStatementYear, cashFlowStatementYear, assumptions) {
    const ebit = incomeStatementYear.ebit;
    const taxRate = assumptions.taxRate;
    const depreciationAndAmortization = incomeStatementYear.depreciationAndAmortization;
    const capex = -cashFlowStatementYear.capitalExpenditures; // CapEx is stored as negative in CFS
    const changeInNWC = cashFlowStatementYear.changeInWorkingCapital; // NWC change is typically subtracted, so if it's positive (use of cash), it reduces FCFF.

    const fcff = ebit * (1 - taxRate) + depreciationAndAmortization - capex - changeInNWC;
    return fcff;
}

/**
 * Calculates Terminal Value using Gordon Growth Model.
 * @param {number} finalYearFCFF - FCFF of the last projected year.
 * @param {number} wacc - Weighted Average Cost of Capital.
 * @param {number} terminalGrowthRate - Perpetual growth rate.
 * @returns {number} Terminal Value.
 */
function calculateTerminalValueGordonGrowth(finalYearFCFF, wacc, terminalGrowthRate) {
    if (wacc <= terminalGrowthRate) {
        // Handle error or return a very large number/specific indicator
        console.error("WACC must be greater than Terminal Growth Rate for Gordon Growth Model.");
        return 0; // Or throw error
    }
    return (finalYearFCFF * (1 + terminalGrowthRate)) / (wacc - terminalGrowthRate);
}

/**
 * Calculates Terminal Value using Exit Multiple method.
 * @param {number} exitYearEBITDA - EBITDA of the exit year.
 * @param {number} exitMultiple - The exit multiple (e.g., EV/EBITDA).
 * @returns {number} Terminal Value.
 */
function calculateTerminalValueExitMultiple(exitYearMetric, exitMultiple) {
    // exitYearMetric could be EBITDA, EBIT, Revenue, etc. depending on the multiple used
    return exitYearMetric * exitMultiple;
}

/**
 * Calculates Net Present Value (NPV).
 * @param {number[]} cashFlows - Array of cash flows (FCFFs for each year, plus Terminal Value in the last year's flow).
 * @param {number} wacc - Discount rate.
 * @returns {number} NPV.
 */
function calculateNPV(cashFlows, wacc) {
    let npv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
        npv += cashFlows[i] / Math.pow((1 + wacc), i + 1);
    }
    return npv;
}

/**
 * Generates DCF valuation and other key metrics.
 * @param {object} financialModel - The output from generateThreeStatementModel.
 * @param {object} inputs - Validated input assumptions (including valuation specific ones like WACC, exit multiple etc.).
 * @param {string} mode - "founder" or "investor".
 * @returns {object} Valuation results (Enterprise Value, Equity Value, NPV, IRR, etc.).
 */
function generateDCFValuation(financialModel, inputs, mode) {
    const { incomeStatement, balanceSheet, cashFlowStatement } = financialModel;
    const valuationAssumptions = inputs.valuationAssumptions;
    const projectionYears = incomeStatement.years.length;

    const fcffs = [];
    for (let i = 0; i < projectionYears; i++) {
        const fcff = calculateFCFF(incomeStatement.years[i], cashFlowStatement.years[i], inputs.assumptions);
        fcffs.push(fcff);
    }

    let terminalValue = 0;
    const finalYearFCFF = fcffs[fcffs.length - 1];
    const exitYearEBITDA = incomeStatement.years[incomeStatement.years.length -1].ebitda // Assuming exit at end of projection

    if (valuationAssumptions.terminalValueMethod === "gordonGrowth") {
        terminalValue = calculateTerminalValueGordonGrowth(finalYearFCFF, valuationAssumptions.wacc, valuationAssumptions.terminalGrowthRate);
    } else if (valuationAssumptions.terminalValueMethod === "exitMultiple") {
        terminalValue = calculateTerminalValueExitMultiple(exitYearEBITDA, valuationAssumptions.exitMultiple);
    } else {
        // Default or error if no method specified - for now, let's try gordon growth as a fallback if params exist
        if(valuationAssumptions.wacc && valuationAssumptions.terminalGrowthRate){
             terminalValue = calculateTerminalValueGordonGrowth(finalYearFCFF, valuationAssumptions.wacc, valuationAssumptions.terminalGrowthRate);
        } else {
            console.warn("Terminal value method not specified or invalid, defaulting to 0");
            terminalValue = 0;
        }
    }

    const cashFlowsForNPV = [...fcffs];
    cashFlowsForNPV[cashFlowsForNPV.length - 1] += terminalValue; // Add TV to the last year's FCFF for discounting

    const enterpriseValue = calculateNPV(cashFlowsForNPV, valuationAssumptions.wacc);
    
    // Equity Value = Enterprise Value - Net Debt
    // Net Debt = Total Debt - Cash & Cash Equivalents from the LATEST balance sheet year
    const latestBSYear = balanceSheet.years[balanceSheet.years.length - 1];
    const netDebt = (latestBSYear.longTermDebt || 0) + (latestBSYear.shortTermDebt || 0) - (latestBSYear.cash || 0);
    const equityValue = enterpriseValue - netDebt;

    // NPV is essentially the enterprise value if we consider the initial investment to be 0 for this type of DCF.
    // Or, if an investment amount is provided, NPV = EV - Investment.
    // For now, let's consider NPV of the free cash flows themselves as the EV.
    const npv = enterpriseValue; 

    // IRR calculation is more complex and typically requires an iterative approach (e.g., Newton-Raphson)
    // For now, we'll placeholder it. Libraries like 'financial' or 'irr' can be used in Node.js.
    const irr = "IRR_calculation_placeholder"; // Placeholder

    return {
        enterpriseValue,
        equityValue,
        terminalValue,
        fcffs,
        npv,
        irr,
        wacc: valuationAssumptions.wacc,
        terminalGrowthRate: valuationAssumptions.terminalGrowthRate, // if used
        exitMultiple: valuationAssumptions.exitMultiple, // if used
        netDebt
    };
}

module.exports = {
    generateDCFValuation,
    calculateFCFF,
    calculateTerminalValueGordonGrowth,
    calculateTerminalValueExitMultiple,
    calculateNPV,
};
