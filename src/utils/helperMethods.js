/**
 * Checks if the given data is empty.
 *
 * @param {*} data - The data to check.
 * @returns {boolean} True if the data is empty, false otherwise.
 */
export const isEmpty = data => {
    if (!data) {
        return true;
    }

    if (Array.isArray(data) && data.length === 0) {
        return true;
    }

    if (typeof data === 'object' && Object.keys(data).length === 0) {
        return true;
    }

    return false;
};

/**
 * Converts a string to title case, replacing underscores with spaces and capitalizing the first letter of each word.
 *
 * @param {string} string - The string to convert.
 * @returns {string} The string in title case.
 */
export const titleCase = string =>
    string.replace(/^_*(.)|_+(.)/g, (_, c, d) => (c ? c.toUpperCase() : ' ' + d.toUpperCase()));

/**
 * Sorts the data based on a threshold value.
 *
 * @param {Object} filteredMetricData - The metric data to be sorted.
 * @param {number|string} threshold - The threshold value for sorting.
 * @returns {Object} The sorted metric data.
 */
export const sortData = (filteredMetricData, threshold) => {
    if (typeof filteredMetricData !== 'object') {
        return;
    }

    Object.keys(filteredMetricData).forEach(dataItem => {
        if (typeof filteredMetricData[dataItem] === 'object') {
            sortData(filteredMetricData[dataItem], threshold);
        } else {
            if (Number(filteredMetricData[dataItem]) < Number(threshold)) {
                delete filteredMetricData[dataItem];
            }
        }
    });

    return filteredMetricData;
};

/**
 * Computes the average of values in an array of objects.
 *
 * @param {Object[]} objectArray - The array of objects.
 * @returns {Object} The object containing averaged values.
 */
export const getAverage = objectArray => {
    const keys = [];
    objectArray.forEach(obj => keys.push(...Object.keys(obj)));

    const formattedKeys = Array.from(new Set(keys));

    const avgObj = {};
    formattedKeys.forEach(key => {
        const values = objectArray.map(obj => obj[key]).filter(value => value !== undefined);

        if (values.every(value => typeof value === 'object' && !Array.isArray(value))) {
            avgObj[key] = getAverage(values);
        } else if (values.every(value => Array.isArray(value))) {
            avgObj[key] = values[0].map((_, index) => getAverage(values.map(arr => arr[index])));
        } else if (values.every(value => typeof value === 'number' || !isNaN(parseFloat(value)))) {
            avgObj[key] = (values.reduce((sum, val) => sum + parseFloat(val), 0) / values.length).toFixed(2);
        }
    });
    return avgObj;
};
