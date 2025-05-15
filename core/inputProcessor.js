// /home/ubuntu/phoenixflow_backend/core/inputProcessor.js

/**
 * Defines input schemas and default values for different modes.
 */
const schemas = {
    founder: {
        // Simplified assumptions for Founder mode
        revenueGrowthRate: { type: "array", itemType: "number", default: [0.1, 0.08, 0.05, 0.03, 0.03], years: 5 },
        cogsAsPercentageOfRevenue: { type: "array", itemType: "number", default: [0.6, 0.6, 0.6, 0.6, 0.6], years: 5 },
        sgaAsPercentageOfRevenue: { type: "array", itemType: "number", default: [0.15, 0.15, 0.14, 0.14, 0.13], years: 5 },
        rdAsPercentageOfRevenue: { type: "array", itemType: "number", default: [0, 0, 0, 0, 0], years: 5, optional: true },
        depreciationAsPercentageOfRevenue: { type: "array", itemType: "number", default: [0.03, 0.03, 0.03, 0.03, 0.03], years: 5 },
        capexAsPercentageOfRevenue: { type: "array", itemType: "number", default: [0.04, 0.04, 0.04, 0.03, 0.03], years: 5 },
        taxRate: { type: "number", default: 0.21 },
        interestRateOnDebt: { type: "number", default: 0.05, optional: true },
        // Working Capital (simplified)
        accountsReceivableAsPercentageOfSales: { type: "number", default: 30/365 },
        inventoryAsPercentageOfCOGS: { type: "number", default: 45/365 },
        accountsPayableAsPercentageOfCOGS: { type: "number", default: 30/365 },
        // Base historical/initial values (can be overridden by user)
        baseRevenue: { type: "number", default: 1000000, optional: true },
        baseCash: { type: "number", default: 100000, optional: true },
        baseDebt: { type: "number", default: 50000, optional: true },
        basePPENet: { type: "number", default: 200000, optional: true },
        baseCommonStock: { type: "number", default: 100000, optional: true },
        baseRetainedEarnings: { type: "number", default: 50000, optional: true },
    },
    investor: {
        // Expects more detailed and complete inputs for Investor mode
        revenueGrowthRate: { type: "array", itemType: "number", required: true, years: 5 },
        cogsAsPercentageOfRevenue: { type: "array", itemType: "number", required: true, years: 5 },
        sgaAsPercentageOfRevenue: { type: "array", itemType: "number", required: true, years: 5 },
        rdAsPercentageOfRevenue: { type: "array", itemType: "number", required: false, default: [0,0,0,0,0], years: 5 }, // Can be optional but explicit
        depreciationAsPercentageOfRevenue: { type: "array", itemType: "number", required: true, years: 5 }, // Or link to PP&E schedule
        capexAsPercentageOfRevenue: { type: "array", itemType: "number", required: true, years: 5 }, // Or link to PP&E schedule
        taxRate: { type: "number", required: true },
        interestRateOnDebt: { type: "number", required: true }, // Or from debt schedule
        accountsReceivableAsPercentageOfSales: { type: "number", required: true },
        inventoryAsPercentageOfCOGS: { type: "number", required: true },
        accountsPayableAsPercentageOfCOGS: { type: "number", required: true },
        // Historical data is expected to be more complete for investor mode
        historicalData: { type: "object", optional: true }, 
        baseRevenue: { type: "number", optional: true }, // Can be part of historical or explicit
        baseCash: { type: "number", optional: true },
        baseDebt: { type: "number", optional: true },
        basePPENet: { type: "number", optional: true },
        baseCommonStock: { type: "number", optional: true },
        baseRetainedEarnings: { type: "number", optional: true },
    }
};

const valuationSchemas = {
    founder: {
        wacc: { type: "number", default: 0.10 },
        terminalValueMethod: { type: "string", default: "exitMultiple", enum: ["gordonGrowth", "exitMultiple"] },
        terminalGrowthRate: { type: "number", default: 0.02, optional: true }, // Used if gordonGrowth
        exitMultiple: { type: "number", default: 8, optional: true }, // Used if exitMultiple (e.g. EV/EBITDA)
        exitMultipleMetric: { type: "string", default: "EBITDA", optional: true } // e.g. EBITDA, Revenue
    },
    investor: {
        wacc: { type: "number", required: true },
        terminalValueMethod: { type: "string", required: true, enum: ["gordonGrowth", "exitMultiple"] },
        terminalGrowthRate: { type: "number", required: function(inputs) { return inputs.terminalValueMethod === "gordonGrowth"; } },
        exitMultiple: { type: "number", required: function(inputs) { return inputs.terminalValueMethod === "exitMultiple"; } },
        exitMultipleMetric: { type: "string", default: "EBITDA", optional: true }
    }
};

/**
 * Processes and validates user inputs based on the selected mode.
 * @param {object} rawInputs - The raw input object from the API request.
 * @param {string} mode - "founder" or "investor".
 * @returns {{ assumptions: object, valuationAssumptions: object, historicalData: object, errors: Array<string> }}
 */
function processInputs(rawInputs, mode) {
    const modeSchema = schemas[mode] || schemas.founder; // Default to founder if mode is invalid
    const modeValuationSchema = valuationSchemas[mode] || valuationSchemas.founder;
    const processedAssumptions = {};
    const processedValuationAssumptions = {};
    const errors = [];

    // Process financial assumptions
    for (const key in modeSchema) {
        const schemaDef = modeSchema[key];
        if (rawInputs.assumptions && rawInputs.assumptions.hasOwnProperty(key)) {
            // Basic type validation (can be expanded with a library like Joi/Zod)
            if (typeof rawInputs.assumptions[key] !== schemaDef.type && schemaDef.type !== "array") {
                errors.push(`Invalid type for ${key}. Expected ${schemaDef.type}, got ${typeof rawInputs.assumptions[key]}.`);
            }
            // TODO: Add array type and itemType validation
            processedAssumptions[key] = rawInputs.assumptions[key];
        } else if (schemaDef.default !== undefined) {
            processedAssumptions[key] = schemaDef.default;
        } else if (schemaDef.required) {
            errors.push(`Missing required input: ${key}`);
        }
    }

    // Process valuation assumptions
    for (const key in modeValuationSchema) {
        const schemaDef = modeValuationSchema[key];
        if (rawInputs.valuationAssumptions && rawInputs.valuationAssumptions.hasOwnProperty(key)) {
            if (typeof rawInputs.valuationAssumptions[key] !== schemaDef.type) {
                 errors.push(`Invalid type for valuation assumption ${key}. Expected ${schemaDef.type}.`);
            }
            processedValuationAssumptions[key] = rawInputs.valuationAssumptions[key];
        } else if (schemaDef.default !== undefined) {
            processedValuationAssumptions[key] = schemaDef.default;
        } else if (typeof schemaDef.required === "function" ? schemaDef.required(processedValuationAssumptions) : schemaDef.required) {
            errors.push(`Missing required valuation input: ${key}`);
        }
    }
    
    // Handle historical data (more critical for investor mode)
    const historicalData = rawInputs.historicalData || {};
    if (mode === "investor" && (!historicalData || Object.keys(historicalData).length === 0)) {
        // Potentially add a warning or expect base values if no full historical provided
        console.warn("[InputProcessor] Investor mode selected but minimal/no historical data provided. Model will rely on base assumptions if available.");
    }

    // Ensure arrays are of correct length for projections (e.g., 5 years)
    const projectionYears = 5; // Standard projection period
    ["revenueGrowthRate", "cogsAsPercentageOfRevenue", "sgaAsPercentageOfRevenue", "rdAsPercentageOfRevenue", "depreciationAsPercentageOfRevenue", "capexAsPercentageOfRevenue"].forEach(key => {
        if (processedAssumptions[key] && Array.isArray(processedAssumptions[key])) {
            if (processedAssumptions[key].length < projectionYears) {
                const lastVal = processedAssumptions[key][processedAssumptions[key].length - 1];
                while (processedAssumptions[key].length < projectionYears) {
                    processedAssumptions[key].push(lastVal); // Extrapolate with last value
                }
            }
            processedAssumptions[key] = processedAssumptions[key].slice(0, projectionYears);
        }
    });

    return {
        assumptions: processedAssumptions,
        valuationAssumptions: processedValuationAssumptions,
        historicalData: historicalData, // Pass through provided historical data
        errors
    };
}

module.exports = {
    processInputs,
};
