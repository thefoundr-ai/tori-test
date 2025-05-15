// /home/ubuntu/phoenixflow_backend/pages/api/generateModel.js

const { processInputs } = require("../../core/inputProcessor");
const { generateThreeStatementModel } = require("../../core/financialModelEngine");
const { generateDCFValuation } = require("../../core/valuationEngine");
const { generateCompsAnalysis } = require("../../core/compsEngine");
const { generateSummaryOutput } = require("../../core/summaryGenerator");
const { generateGoogleSheet } = require("../../services/googleSheetsGenerator"); // Mocked
const { generateExcelFile } = require("../../services/excelExporter"); // Mocked
const { uploadFileToStorage, saveModelDataToFirestore } = require("../../services/firebaseAdmin"); // Mocked

/**
 * API handler for generating financial models.
 * Expected request body: {
 *   inputs: { // Raw inputs including assumptions, valuationAssumptions, historicalData, comparableCompanies
 *     assumptions: { ... },
 *     valuationAssumptions: { ... },
 *     historicalData: { ... }, // Optional
 *     comparableCompanies: [ ... ] // Optional
 *   },
 *   user_id: "string",
 *   mode: "founder" | "investor"
 * }
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { inputs: rawInputs, user_id, mode } = req.body;

        if (!rawInputs || !user_id || !mode) {
            return res.status(400).json({ error: "Missing required fields: inputs, user_id, or mode." });
        }

        const projectionYears = 5; // Or make this configurable

        // 1. Process and Validate Inputs
        const processedInputs = processInputs(rawInputs, mode);
        if (processedInputs.errors && processedInputs.errors.length > 0) {
            return res.status(400).json({ error: "Input validation failed", details: processedInputs.errors });
        }

        // 2. Generate 3-Statement Model
        const financialModel = generateThreeStatementModel(processedInputs, mode, projectionYears);

        // 3. Generate DCF Valuation
        const valuationResults = generateDCFValuation(financialModel, processedInputs, mode);

        // 4. Generate Comps Analysis (if data provided)
        let compsAnalysis = {};
        if (rawInputs.comparableCompanies && rawInputs.comparableCompanies.length > 0) {
            compsAnalysis = generateCompsAnalysis(rawInputs.comparableCompanies, mode);
        }

        // 5. Generate Google Sheet (Mocked)
        const googleSheetUrl = await generateGoogleSheet(financialModel, valuationResults, compsAnalysis, processedInputs, mode, user_id);

        // 6. Generate Excel File (Mocked)
        const excelFilePath = await generateExcelFile(financialModel, valuationResults, compsAnalysis, processedInputs, mode, user_id);

        // 7. Upload Excel File to Firebase Storage (Mocked)
        const excelFileUrl = await uploadFileToStorage(excelFilePath, user_id);

        // 8. Generate Structured Summary Output
        const summaryOutput = generateSummaryOutput(valuationResults, financialModel, processedInputs, mode);
        // Potentially enrich summary with comps data if available
        if (compsAnalysis.summaryMetrics) {
            summaryOutput.comparableCompanySummary = compsAnalysis.summaryMetrics;
        }

        // 9. Save File Links and Summary to Firebase Firestore (Mocked)
        const firestoreDocId = await saveModelDataToFirestore(user_id, mode, googleSheetUrl, excelFileUrl, summaryOutput);
        console.log(`[API Handler] Firestore document created: ${firestoreDocId}`);

        // 10. Return JSON Response
        return res.status(200).json({
            message: "Financial model generated successfully.",
            googleSheetUrl,
            excelDownloadUrl: excelFileUrl,
            summary: summaryOutput,
            firebaseDocId: firestoreDocId
        });

    } catch (error) {
        console.error("[API Handler] Error generating financial model:", error);
        return res.status(500).json({ error: "Internal server error while generating model.", details: error.message });
    }
}
