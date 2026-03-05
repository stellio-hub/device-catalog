

/**
 * Returns the zone index based on value and an array of thresholds.
 * @param {number} value - The value to check.
 * @param {number[]} thresholds - Array of threshold values (length 4 for 5 zones).
 * @returns {number} Zone index :  1 to (length of thresholds + 1).
 * @description The function checks the value against the thresholds and returns the corresponding zone index.
 */
function zonefromvalue(value, thresholds) {
    for (let i = 0; i < thresholds.length; i++) {
        if (value < thresholds[i]) {
            return i + 1;
        }
    }
    return thresholds.length + 1;
}

exports.zonefromvalue = zonefromvalue;