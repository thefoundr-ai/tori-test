// /home/ubuntu/phoenixflow_backend/utils/financialUtils.js

/**
 * Calculates the value based on a previous value and a growth rate.
 * @param {number} previousValue The base value from the previous period.
 * @param {number} growthRate The growth rate (e.g., 0.05 for 5%).
 * @returns {number} The new value after applying growth.
 */
function applyGrowth(previousValue, growthRate) {
    if (typeof previousValue !== 'number' || typeof growthRate !== 'number') {
        // Or handle error more gracefully
        return previousValue; 
    }
    return previousValue * (1 + growthRate);
}

/**
 * Calculates a value as a percentage of another value.
 * @param {number} baseValue The value to calculate the percentage of.
 * @param {number} percentage The percentage (e.g., 0.20 for 20%).
 * @returns {number} The calculated percentage value.
 */
function calculatePercentageOf(baseValue, percentage) {
    if (typeof baseValue !== 'number' || typeof percentage !== 'number') {
        return 0; // Or handle error
    }
    return baseValue * percentage;
}

module.exports = {
    applyGrowth,
    calculatePercentageOf,
};
