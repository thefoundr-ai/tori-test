// /home/ubuntu/phoenixflow_backend/core/summaryGenerator.js

/**
 * Creates a structured summary of the financial model outputs and key assumptions.
 * @param {object} valuationData - The output from the valuationEngine.
 * @param {object} financialModelData - The output from the financialModelEngine.
 * @param {object} processedInputs - The processed and validated inputs, including assumptions.
 * @param {string} mode - "founder" or "investor".
 * @returns {object} A structured JSON summary.
 */
function generateSummaryOutput(valuationData, financialModelData, processedInputs, mode) {
    const summary = {};

    // Valuation Metrics
    summary.estimatedEnterpriseValue = valuationData.enterpriseValue;
    summary.estimatedEquityValue = valuationData.equityValue;
    // Equity value per share would require shares outstanding input, which is not explicitly defined yet.
    // We can add a note or placeholder if shares outstanding are provided in inputs.
    if (processedInputs.assumptions && processedInputs.assumptions.sharesOutstanding) {
        if (valuationData.equityValue && processedInputs.assumptions.sharesOutstanding > 0) {
            summary.equityValuePerShare = valuationData.equityValue / processedInputs.assumptions.sharesOutstanding;
        } else {
            summary.equityValuePerShare = null; // Not calculable
        }
    } else {
        summary.equityValuePerShare = "Shares outstanding not provided";
    }

    summary.irr = valuationData.irr; // This is currently a placeholder in valuationEngine
    summary.npv = valuationData.npv;

    // Key Valuation Multiples (from DCF exit or comps if available)
    summary.keyValuationMultiples = {};
    if (valuationData.exitMultiple && processedInputs.valuationAssumptions.exitMultipleMetric) {
        summary.keyValuationMultiples.dcfExitMultiple = {
            metric: processedInputs.valuationAssumptions.exitMultipleMetric,
            value: valuationData.exitMultiple
        };
    }
    // TODO: Integrate comps multiples if compsEngine is run and data is available
    // For example: if (compsSummary && compsSummary.evToEbitda) summary.keyValuationMultiples.compsEvToEbitda = compsSummary.evToEbitda.median;

    // Recap of Core Assumptions
    summary.coreAssumptions = {
        wacc: processedInputs.valuationAssumptions.wacc,
        terminalValueMethod: processedInputs.valuationAssumptions.terminalValueMethod,
    };
    if (processedInputs.valuationAssumptions.terminalValueMethod === "gordonGrowth") {
        summary.coreAssumptions.terminalGrowthRate = processedInputs.valuationAssumptions.terminalGrowthRate;
    }
    if (processedInputs.valuationAssumptions.terminalValueMethod === "exitMultiple") {
        summary.coreAssumptions.exitMultiple = processedInputs.valuationAssumptions.exitMultiple;
        summary.coreAssumptions.exitMultipleMetric = processedInputs.valuationAssumptions.exitMultipleMetric;
    }
    // Exit year is an input assumption for the model duration, not explicitly a DCF assumption here yet.
    // It's implied by the projectionYears.
    summary.coreAssumptions.projectionYears = financialModelData.incomeStatement.years.length;

    // Add some key projected financials for context
    if (financialModelData.incomeStatement.years.length > 0) {
        const firstProjectedYearIS = financialModelData.incomeStatement.years[0];
        const lastProjectedYearIS = financialModelData.incomeStatement.years[financialModelData.incomeStatement.years.length - 1];
        summary.keyProjectedFinancials = {
            firstYearRevenue: firstProjectedYearIS.revenue,
            firstYearEbitda: firstProjectedYearIS.ebitda,
            lastYearRevenue: lastProjectedYearIS.revenue,
            lastYearEbitda: lastProjectedYearIS.ebitda,
        };
    }
    
    summary.generationMode = mode;
    summary.generatedAt = new Date().toISOString();

    return summary;
}

module.exports = {
    generateSummaryOutput,
};
