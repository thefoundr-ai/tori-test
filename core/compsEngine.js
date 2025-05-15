// /home/ubuntu/phoenixflow_backend/core/compsEngine.js

/**
 * Processes comparable company data and calculates relevant multiples.
 * @param {Array<object>} compsData - Array of comparable company objects, each with financial data.
 * @param {string} mode - "founder" or "investor".
 * @returns {object} Analysis of comparable companies, including individual and summary multiples.
 */
function generateCompsAnalysis(compsData, mode) {
    if (!compsData || compsData.length === 0) {
        return {
            summaryMetrics: {},
            detailedComps: [],
            message: "No comparable company data provided."
        };
    }

    const detailedComps = compsData.map(comp => {
        const calculatedComp = { ...comp };
        // Ensure necessary data points exist before calculating multiples
        // EV/Revenue
        if (comp.enterpriseValue && comp.ltmRevenue && comp.ltmRevenue !== 0) {
            calculatedComp.evToRevenue = comp.enterpriseValue / comp.ltmRevenue;
        } else {
            calculatedComp.evToRevenue = null; // Or some indicator for missing data
        }

        // EV/EBITDA
        if (comp.enterpriseValue && comp.ltmEbitda && comp.ltmEbitda !== 0) {
            calculatedComp.evToEbitda = comp.enterpriseValue / comp.ltmEbitda;
        } else {
            calculatedComp.evToEbitda = null;
        }

        // P/E
        if (comp.marketCap && comp.ltmNetIncome && comp.ltmNetIncome !== 0) {
            calculatedComp.peRatio = comp.marketCap / comp.ltmNetIncome;
        } else {
            calculatedComp.peRatio = null;
        }
        return calculatedComp;
    });

    // Calculate summary statistics (Mean, Median, High, Low)
    const summaryMetrics = {};
    const validEvToRevenue = detailedComps.map(c => c.evToRevenue).filter(v => v !== null && !isNaN(v));
    const validEvToEbitda = detailedComps.map(c => c.evToEbitda).filter(v => v !== null && !isNaN(v));
    const validPeRatios = detailedComps.map(c => c.peRatio).filter(v => v !== null && !isNaN(v));

    const calculateStats = (arr) => {
        if (arr.length === 0) return { mean: null, median: null, high: null, low: null };
        arr.sort((a, b) => a - b);
        const sum = arr.reduce((acc, val) => acc + val, 0);
        const mean = sum / arr.length;
        const mid = Math.floor(arr.length / 2);
        const median = arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
        const high = arr[arr.length - 1];
        const low = arr[0];
        return { mean, median, high, low };
    };

    if (validEvToRevenue.length > 0) {
        summaryMetrics.evToRevenue = calculateStats(validEvToRevenue);
    }
    if (validEvToEbitda.length > 0) {
        summaryMetrics.evToEbitda = calculateStats(validEvToEbitda);
    }
    if (validPeRatios.length > 0) {
        summaryMetrics.peRatio = calculateStats(validPeRatios);
    }

    // Investor mode might have more detailed output or require more rigorous data
    if (mode === "investor") {
        // Potentially add more metrics or checks for investor mode
    }

    return {
        summaryMetrics,
        detailedComps,
    };
}

module.exports = {
    generateCompsAnalysis,
};
