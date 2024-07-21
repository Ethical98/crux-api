// Importing NPM Modules
import { useState } from 'react';
import axios from 'axios';

// Importing Helper Methods
import { getAverage, isEmpty, sortData, titleCase } from './utils/helperMethods';

// Importing Constants
import { API_URL, LABEL_TEXT, PLATFORM, URL_REGEX } from './constants';

function App() {
    // States
    const [error, setError] = useState('');
    const [metricData, setMetricData] = useState({});
    const [dataFilter, setDataFilter] = useState([]);
    const [filteredMetricData, setFilteredMetricData] = useState({});
    const [thresholdValues] = useState(new Set());
    const [selectedThreshold, setSelectedThreshold] = useState(0);
    const [inputArray, setInputArray] = useState(1);
    const [apiError, setApiError] = useState([]);

    /**
     * Handler function for filter change events.
     *
     * @param {Event} event - The filter change event.
     */
    const filterChangeHandler = event => {
        const value = event.target.value;
        if (dataFilter.includes(value)) {
            const updatedFilter = dataFilter.filter(filterProperty => filterProperty !== value);

            const updatedMetricData = sortData(JSON.parse(JSON.stringify(filteredMetricData)), selectedThreshold);
            delete updatedMetricData[value];
            setFilteredMetricData(updatedMetricData);
            setDataFilter(updatedFilter);
        } else {
            const updatedFilter = dataFilter;
            updatedFilter.push(value);
            const updatedMetricData = { ...filteredMetricData };
            updatedMetricData[value] = metricData[value];
            setFilteredMetricData(sortData(JSON.parse(JSON.stringify(updatedMetricData)), selectedThreshold));
            setDataFilter(updatedFilter);
        }
    };

    /**
     * Handler function for threshold change events.
     *
     * @param {Event} event - The threshold change event.
     */
    const thresholdChangeHandler = event => {
        setSelectedThreshold(event.target.value);
        const updatedData = sortData(JSON.parse(JSON.stringify(metricData)), event.target.value);

        setFilteredMetricData(updatedData);
    };

    /**
     * Helper function to recursively print data from an object.
     *
     * @param {Object} obj - The object to print data from.
     * @returns {JSX.Element} The JSX representation of the object's data.
     */
    const printDataHelper = obj => {
        if (typeof obj !== 'object') {
            return;
        }

        return (
            <>
                {Object.keys(obj)
                    .sort()
                    .map(item => {
                        if (typeof obj[item] !== 'object') {
                            thresholdValues.add(Number(obj[item]));
                        }
                        return (
                            <div className={`${typeof obj[item] === 'object' ? 'mb-3' : 'flex'}`}>
                                {!Array.isArray(obj) && (
                                    <label className={`${typeof obj[item] !== 'object' ? 'flex-1' : ''}`}>
                                        {titleCase(item)}
                                    </label>
                                )}
                                {typeof obj[item] === 'object' ? (
                                    printDataHelper(obj[item])
                                ) : (
                                    <span className="flex-1 text-[14px]">{obj[item]}</span>
                                )}
                            </div>
                        );
                    })}
            </>
        );
    };

    /**
     * Handler function for form submission events.
     *
     * @param {Event} event - The form submission event.
     */
    const submitHandler = async event => {
        event.preventDefault();
        setFilteredMetricData({});
        setError({});
        setApiError([]);

        const urls = Array.from(event.target.elements).filter(field => field.type === 'text');

        const platform = event.target.platform.value;

        const dataArray = [];
        const errorState = {};
        const dataError = [];

        urls.forEach(url => {
            if (!url.value.match(URL_REGEX)) {
                errorState[url.id] = 'Please enter in correct format. Eg. https://www.wxample.com';
            }
        });

        if (isEmpty(errorState)) {
            await Promise.all(
                urls.map(async url => {
                    const requestData = { formFactor: platform, origin: url.value };
                    try {
                        const { data = {} } = await axios.post(API_URL, requestData);
                        const { record = {} } = data;
                        const { metrics = {} } = record;
                        dataArray.push(metrics);
                    } catch (err) {
                        dataError.push({ data: err?.response?.data, url: url.value });
                    }
                })
            );
        }

        if (isEmpty(errorState) && isEmpty(dataError)) {
            const metrics = urls.length === 1 ? dataArray[0] : getAverage(dataArray);
            setMetricData(metrics);
            setDataFilter(Object.keys(metrics));
            setFilteredMetricData(metrics);
            setApiError([]);
        } else {
            setError(errorState);
            setApiError(dataError);
        }
    };

    console.log(apiError, 'error');

    return (
        <div>
            <header className="text-cyan-300 font-bold text-2xl text-center sticky top-0 bg-white shadow-lg z-[1] p-5">
                <h1 className="m-auto">{LABEL_TEXT.HEADER}</h1>
            </header>
            <div className="content-wrapper">
                <form onSubmit={submitHandler} className="mx-10 flex mt-10 rounded border p-5 shadow-lg flex-wrap">
                    <div>
                        <div className="lg:flex justify-between gap-x-5">
                            {Array.from(Array(inputArray).keys()).map(index => (
                                <div className="relative mb-5">
                                    <input
                                        type="text"
                                        id={`url-${index}`}
                                        required
                                        placeholder="Please enter URL"
                                        className="text-[14px] p-2 mr-5 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 w-[200px] lg:w-[300px]"
                                    />

                                    {inputArray !== 3 && index === 0 && (
                                        <button
                                            className="text-green-100 font-bold p-2 my-2 transition-colors duration-150 bg-green-600 rounded-lg focus:shadow-outline hover:bg-green-800 w-auto text-[12px] lg:m-0"
                                            onClick={() => setInputArray(prev => prev + 1)}
                                        >
                                            {LABEL_TEXT.ADD_CTA}
                                        </button>
                                    )}
                                    {index !== 0 && (
                                        <button
                                            className="font-bold p-2 my-2 text-red-100 transition-colors duration-150 bg-red-600 rounded-lg focus:shadow-outline hover:bg-red-800 w-auto text-[12px] xl:m-0"
                                            onClick={() => setInputArray(prev => prev - 1)}
                                        >
                                            {LABEL_TEXT.DELETE_CTA}
                                        </button>
                                    )}
                                    {!isEmpty(error) && (
                                        <p className="text-[10px] text-red-600">{error[`url-${index}`]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-5">
                            <h2>{LABEL_TEXT.PLATFORM_HEADING}</h2>
                            <div className=" flex flex-wrap gap-x-2">
                                {PLATFORM.map(platform => (
                                    <div>
                                        <input
                                            className="mr-2"
                                            type="radio"
                                            id={platform}
                                            name="platform"
                                            value={platform}
                                            defaultChecked={platform === PLATFORM[0]}
                                        />
                                        <label>{platform}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        class="ml-5 mb-5 h-10 px-5 text-indigo-700 transition-colors duration-150 border border-indigo-500 rounded-lg focus:shadow-outline hover:bg-indigo-500 hover:text-indigo-100 self-center"
                    >
                        {LABEL_TEXT.SEARCH_CTA}
                    </button>
                </form>
                {!isEmpty(filteredMetricData) && (
                    <div className="mx-10 mt-10">
                        <div>
                            <h1>{LABEL_TEXT.DATA_FILTERS_HEADING}</h1>
                            <div className="checkbox-wrapper flex flex-wrap gap-x-10 gap-y-2 mt-3 ">
                                {Object.keys(metricData)
                                    .sort()
                                    .map(property => (
                                        <div>
                                            <input
                                                id={property}
                                                className="mr-5"
                                                type="checkbox"
                                                value={property}
                                                checked={dataFilter.includes(property)}
                                                onChange={filterChangeHandler}
                                            />
                                            <label htmlFor={property}>{titleCase(property)}</label>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <div className="flex mt-5">
                            <h2 className="mr-5">{LABEL_TEXT.SORT_HEADING}</h2>
                            <select
                                onChange={thresholdChangeHandler}
                                class="w-auto h-auto pl-3 pr-6 text-base placeholder-gray-600 border rounded-lg appearance-none focus:shadow-outline"
                                placeholder="Regular input"
                            >
                                {Array.from(thresholdValues)
                                    .sort()
                                    .map(value => (
                                        <option value={value}>{value}</option>
                                    ))}
                            </select>
                        </div>
                    </div>
                )}
                <div className="mx-10">
                    {inputArray !== 1 && !isEmpty(filteredMetricData) && (
                        <h3 className="mt-5 font-bold text-center">{LABEL_TEXT.SUMMARY_HEADING}</h3>
                    )}
                    <div className="flex flex-wrap data-container gap-x-10 gap-y-5">
                        {printDataHelper(filteredMetricData)}
                    </div>
                </div>
                {!isEmpty(apiError) && (
                    <div className="text-center">
                        {apiError.map((error, index) => (
                            <div key={`api-error-${index}`}>
                                <p>
                                    {LABEL_TEXT.URL_LABEL}
                                    {error.url}
                                </p>
                                <p>{error?.data?.error?.code}</p>
                                <p>{titleCase(error?.data?.error?.message)}</p>
                                <p>{error?.data?.error?.status}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
