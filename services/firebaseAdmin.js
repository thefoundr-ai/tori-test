// /home/ubuntu/phoenixflow_backend/services/firebaseAdmin.js

// This is a mock implementation for demonstrating the structure and logic.
// A real implementation would use the firebase-admin SDK.
const path = require("path");

/**
 * Simulates initializing the Firebase Admin SDK.
 */
function initializeFirebaseAdmin() {
    // In a real app, this would be: admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    // Or rely on Vercel environment variables for Firebase config if deployed there.
    console.log("[MockFirebaseAdmin] Firebase Admin SDK initialized (simulated).");
}

// Call initialization once when the module is loaded
initializeFirebaseAdmin();

/**
 * Simulates uploading a file to Firebase Storage and returning a public URL.
 * @param {string} localFilePath - The local path to the file to upload.
 * @param {string} userId - User ID for organizing storage if needed.
 * @returns {Promise<string>} A mock public URL for the uploaded file.
 */
async function uploadFileToStorage(localFilePath, userId) {
    const fileName = path.basename(localFilePath);
    console.log(`[MockFirebaseAdmin] Simulating upload of ${fileName} to Firebase Storage for user ${userId}.`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    const mockStoragePath = `users/${userId}/models/${fileName}`;
    const mockPublicUrl = `https://firebasestorage.googleapis.com/v0/b/mock-project.appspot.com/o/${encodeURIComponent(mockStoragePath)}?alt=media&token=mock-token`;
    console.log(`[MockFirebaseAdmin] File accessible at mock URL: ${mockPublicUrl}`);
    return mockPublicUrl;
}

/**
 * Simulates saving model data (links and summary) to Firestore.
 * @param {string} userId - The ID of the user.
 * @param {string} mode - "founder" or "investor".
 * @param {string} googleSheetUrl - URL of the generated Google Sheet.
 * @param {string} excelFileUrl - Public URL of the generated Excel file in Firebase Storage.
 * @param {object} summaryOutput - The structured summary of the model.
 * @returns {Promise<string>} The ID of the created Firestore document.
 */
async function saveModelDataToFirestore(userId, mode, googleSheetUrl, excelFileUrl, summaryOutput) {
    const docId = `model_output_${userId}_${Date.now()}`;
    const dataToSave = {
        userId,
        mode,
        googleSheetUrl,
        excelFileUrl,
        summary: summaryOutput,
        createdAt: new Date().toISOString(),
    };
    console.log(`[MockFirebaseAdmin] Simulating saving data to Firestore in collection 'modelOutputs' with doc ID ${docId}:`);
    console.log(dataToSave);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`[MockFirebaseAdmin] Data saved to Firestore (simulated).`);
    return docId;
}

module.exports = {
    uploadFileToStorage,
    saveModelDataToFirestore,
};
