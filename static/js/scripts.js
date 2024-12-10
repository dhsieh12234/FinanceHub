function showWindow(entity) {
    console.log(`showWindow called for: ${entity}`); // Debugging
    const resultsContainer = document.getElementById('results_container');

    // Ensure the container exists
    if (!resultsContainer) {
        console.error('results_container not found.');
        return;
    }

    // Hide all specific tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.add('hidden'));

    // Show the selected tab content
    const selectedTab = document.getElementById(`${entity}-tab`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }

    // Clear the results container
    resultsContainer.innerHTML = '';

    // Toggle the sidebar visibility based on the selected entity
    const sidebarStocks = document.getElementById('left-sidebar-stocks');
    const sidebarCompanies = document.getElementById('left-sidebar-companies');
    const sidebarBanks = document.getElementById('left-sidebar-banks');
    const sidebarManagers = document.getElementById('left-sidebar-managers'); 
    const sidebarPortfolios = document.getElementById('left-sidebar-portfolios'); // Add Portfolio Sidebar

    // Hide all sidebars initially
    sidebarStocks.classList.add('hidden');
    sidebarCompanies.classList.add('hidden');
    sidebarBanks.classList.add('hidden');
    sidebarManagers.classList.add('hidden');
    sidebarPortfolios.classList.add('hidden'); // Hide Portfolio Sidebar by default

    // Show the relevant sidebar based on the selected entity
    if (entity === 'stocks') {
        sidebarStocks.classList.remove('hidden');
    } else if (entity === 'companies') {
        sidebarCompanies.classList.remove('hidden');
    } else if (entity === 'investment_banks') {
        sidebarBanks.classList.remove('hidden');
    } else if (entity === 'managers') {
        sidebarManagers.classList.remove('hidden');
    } else if (entity === 'portfolios') {
        sidebarPortfolios.classList.remove('hidden'); // Show Portfolio Sidebar
    }
}


// Function to handle "Advanced Options"
function showAdvancedQuery(type) {
    const resultsContainer = document.getElementById('results_container');
    if (type === 'stocks') {
        resultsContainer.innerHTML = `<h2>Advanced Query: Stocks</h2>
            <form id="stocks-query-form">
                <label>
                    Min Year-End Price:
                    <input type="number" id="min_price" placeholder="Enter min price">
                </label>
                <label>
                    Max Year-End Price:
                    <input type="number" id="max_price" placeholder="Enter max price">
                </label>
                <button type="button" onclick="searchStocks()">Search Stocks</button>
            </form>
            <div id="advanced_results" class="results"></div>`;
    }
}

// Function to perform a basic search by category
async function search(category) {
    const input = document.getElementById(`search_${category}`);
    const resultsDiv = document.getElementById(`results_${category}`);
    const query = input.value.trim();

    if (!query) {
        resultsDiv.innerHTML = '<p>Please enter a search term.</p>';
        return;
    }

    resultsDiv.innerHTML = `<p>Searching for "${query}" in ${category.replace('_', ' ')}...</p>`;

    try {
        let firstname = true;
        let lastname = true;
        if (category === 'managers') {
            firstname = document.getElementById('search_firstname').checked;
            lastname = document.getElementById('search_lastname').checked;
        }
        // Call the backend API
        const response = await fetch(`/search?entity=${category}&name=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.error) {
            resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        } else if (data.length === 0) {
            resultsDiv.innerHTML = `<p>No results found for "${query}".</p>`;
        } else {
            // Display the results as tables
            resultsDiv.innerHTML = data.map(item => createTable(item)).join('');
        }
    } catch (error) {
        resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Function to create a table for displaying results
function createTable(item) {
    const rows = Object.entries(item)
        .map(([key, value]) => `<tr><td><strong>${capitalizeFirstLetter(key)}</strong></td><td>${value}</td></tr>`)
        .join('');

    return `
        <table border="1">
            <thead>
                <tr>
                    <th>Attribute</th>
                    <th>Content</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

// Function to handle password submission
async function submitPassword() {
    const password = document.getElementById('root-password').value;
    const errorDiv = document.getElementById('password-error');
    errorDiv.textContent = ''; // Clear previous error messages

    try {
        const response = await fetch('/submit-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();
        if (data.success) {
            // Hide the password form and show the main content
            document.getElementById('password-form').style.display = 'none';
            document.querySelector('main.content').classList.remove('hidden'); // Show the content
        } else {
            errorDiv.textContent = data.error || 'Invalid password.';
        }
    } catch (err) {
        errorDiv.textContent = 'Error connecting to the server.';
    }
}

// Function to perform advanced search for stocks
async function searchStocks() {
    const minPrice = document.getElementById('min_price').value;
    const maxPrice = document.getElementById('max_price').value;
    const resultsDiv = document.getElementById('advanced_results');

    resultsDiv.innerHTML = `<p>Searching for stocks...</p>`;

    try {
        // Build the query parameters dynamically
        const params = new URLSearchParams();
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);

        const response = await fetch(`/stocks/search?${params.toString()}`);
        const data = await response.json();

        if (data.error) {
            resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        } else if (data.length === 0) {
            resultsDiv.innerHTML = `<p>No stocks found for the specified criteria.</p>`;
        } else {
            // Display results based on the selected preference
            resultsDiv.innerHTML = data
                .map(
                    stock => `
                        <div>
                            <strong>${displayPreference === 'symbol' ? stock.stock_code : stock.company_name}</strong>
                            ${displayPreference === 'symbol' ? `(${stock.company_name})` : ` - Symbol: ${stock.stock_code}`}
                            <br>
                            Year-End Price: ${stock.year_end_price}
                        </div>
                        <hr>
                    `
                )
                .join('');
        }
    } catch (error) {
        resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Function to show the selected tab and toggle the sidebar visibility
function showTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.add('hidden'));

    // Show the selected tab content
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }

    // Toggle the sidebar visibility based on the selected tab
    const sidebar = document.getElementById('left-sidebar');
    if (tabId === 'stocks-tab') {
        sidebar.classList.remove('hidden'); // Show sidebar
    } else {
        sidebar.classList.add('hidden'); // Hide sidebar
    }

    // Optionally, hide the default results container when a specific tab is selected
    const defaultResults = document.getElementById('results_container');
    if (tabId !== 'default-tab') {
        defaultResults.classList.add('hidden');
    } else {
        defaultResults.classList.remove('hidden');
    }
}

// Function to update display preference for stocks
let displayPreference = 'symbol';

function updateDisplayPreference(preference) {
    displayPreference = preference;
    console.log(`Display preference updated to: ${displayPreference}`);
}

// Function to update displayed price range
function updatePriceRange() {
    const minPriceInput = document.getElementById('min_price');
    const maxPriceInput = document.getElementById('max_price');
    const priceRangeDisplay = document.getElementById('price-range-value');
    const resultsContainer = document.getElementById('results_container');

    // Parse input values
    let minPrice = parseFloat(minPriceInput.value) || 0;
    let maxPrice = parseFloat(maxPriceInput.value) || 1200;

    // Check if max is lower than min
    if (minPrice > maxPrice) {
        // Report error in the results container
        resultsContainer.innerHTML = '<p class="error-message">Error: Max price must be greater than or equal to min price.</p>';
        priceRangeDisplay.textContent = `$${minPrice} - Invalid`;
        return;
    }

    // Clear any previous error and update the displayed range
    resultsContainer.innerHTML = ''; // Clear error messages
    priceRangeDisplay.textContent = `$${minPrice} - $${maxPrice}`;
}


// Function to update displayed year-end total number of shares range
function updateValueRange() {
    const minValueInput = document.getElementById('min_market_value');
    const maxValueInput = document.getElementById('max_market_value');
    const marketValueRangeDisplay = document.getElementById('market-value-range-value');
    const resultsContainer = document.getElementById('results_container');

    // Parse input values
    let minValue = parseFloat(minValueInput.value) || 0;
    let maxValue = parseFloat(maxValueInput.value) || 1000;

    // Check if max is lower than min
    if (minValue > maxValue) {
        // Report error in the results container
        resultsContainer.innerHTML = '<p class="error-message">Error: Max market value must be greater than or equal to min market value.</p>';
        marketValueRangeDisplay.textContent = `$${minValue}B - Invalid`;
        return;
    }

    // Clear any previous error and update the displayed range
    resultsContainer.innerHTML = ''; // Clear error messages
    marketValueRangeDisplay.textContent = `$${minValue}B - $${maxValue}B`;
}


// Function to update displayed year-end total number of shares range
function updateSharesRange() {
    const minSharesInput = document.getElementById('min_shares');
    const maxSharesInput = document.getElementById('max_shares');
    const sharesRangeDisplay = document.getElementById('shares-range-value');
    const resultsContainer = document.getElementById('results_container');

    // Parse input values
    let minShares = parseFloat(minSharesInput.value) || 100;
    let maxShares = parseFloat(maxSharesInput.value) || 15000;

    // Check if max is lower than min
    if (minShares > maxShares) {
        // Report error in the results container
        resultsContainer.innerHTML = '<p class="error-message">Error: Max shares must be greater than or equal to min shares.</p>';
        sharesRangeDisplay.textContent = `${minShares}M - Invalid`;
        return;
    }

    // Clear any previous error and update the displayed range
    resultsContainer.innerHTML = ''; // Clear error messages
    sharesRangeDisplay.textContent = `${minShares}M - ${maxShares}M`;
}




// Function to lock in the selected filters and display results in the results_container
async function lockInSearchStocks() {
    console.log("Lock In Search triggered"); // Debugging

    // Collect filter values
    const nameInput = document.getElementById('stock-search-input')?.value.trim() || ''; // Stock name input

    const minPrice = document.getElementById('min_price')?.value || 0;
    const maxPrice = document.getElementById('max_price')?.value || 1200;

    const minMarketValue = (document.getElementById('min_market_value')?.value || 0) * 1_000_000_000; // Convert billions
    const maxMarketValue = (document.getElementById('max_market_value')?.value || 5000) * 1_000_000_000; // Convert billions

    const minShares = (document.getElementById('min_shares')?.value || 100) * 1_000_000; // Convert millions
    const maxShares = (document.getElementById('max_shares')?.value || 16_000) * 1_000_000; // Convert millions

    // Collect selected display options
    const selectedDisplayOptions = Array.from(
        document.querySelectorAll('input[name="stock_display_option"]:checked')
    ).map((option) => option.value);

    const resultsContainer = document.getElementById('results_container');
    if (!resultsContainer) {
        console.error('Results container not found.');
        return;
    }

    resultsContainer.innerHTML = '<p>Loading results...</p>';

    try {
        // Build query parameters
        const params = new URLSearchParams({
            entity: 'stocks',
            name: nameInput,
            min_price: minPrice,
            max_price: maxPrice,
            min_market_value: minMarketValue,
            max_market_value: maxMarketValue,
            min_shares: minShares,
            max_shares: maxShares,
            display_fields: selectedDisplayOptions.join(','), // Send display options as a comma-separated string
        });

        console.log(`Query parameters: ${params.toString()}`); // Debugging

        // Fetch results
        const response = await fetch(`/search?${params.toString()}`);
        const data = await response.json();

        // Check and display results
        if (data.error) {
            resultsContainer.innerHTML = `<p>Error: ${data.error}</p>`;
        } else if (data.length === 0) {
            resultsContainer.innerHTML = '<p>No results found for the specified criteria.</p>';
        } else {
            resultsContainer.innerHTML = data
                .map((item) => {
                    let result = '';
                    if (selectedDisplayOptions.includes('code')) {
                        result += `<strong>Code:</strong> ${item.stock_code || 'N/A'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('name')) {
                        result += `<strong>Name:</strong> ${item.name || 'N/A'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('year_end_price')) {
                        result += `<strong>Year-End Price:</strong> $${item.year_end_price || 'N/A'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('year_end_shares')) {
                        result += `<strong>Year-End Shares:</strong> ${item.year_end_shares || 'N/A'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('year_end_market_value')) {
                        result += `<strong>Year-End Market Value:</strong> $${item.year_end_market_value || 'N/A'}<br>`;
                    }
                    return `<div class="result-item">${result}</div><hr>`;
                })
                .join('');
        }
    } catch (error) {
        console.error(error); // Debugging
        resultsContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}


async function lockInSearchCompanies() {
    console.log("Lock In Search for Companies triggered"); // Debugging

    // Collect filter values
    const nameInput = document.getElementById('company-search-input')?.value.trim() || ''; // Company name input
    const industryInput = document.getElementById('company_industry')?.value || ''; // Selected industry
    const cityInput = document.getElementById('company_city')?.value || ''; // Selected city

    // Collect price range
    const minPrice = document.getElementById('min_price2')?.value || 0;
    const maxPrice = document.getElementById('max_price2')?.value || 1200;

    // Collect market value (convert billions to raw numbers)
    const minMarketValue = (document.getElementById('min_market_value2')?.value || 0) * 1_000_000_000;
    const maxMarketValue = (document.getElementById('max_market_value2')?.value || 5000) * 1_000_000_000;

    // Collect total shares (convert millions to raw numbers)
    const minShares = (document.getElementById('min_shares2')?.value || 0) * 1_000_000;
    const maxShares = (document.getElementById('max_shares2')?.value || 16000) * 1_000_000;

    // Collect selected display options
    const selectedDisplayOptions = Array.from(
        document.querySelectorAll('input[name="company_display_option"]:checked')
    ).map((option) => option.value);

    // Always include 'symbol' in the display options
    if (!selectedDisplayOptions.includes('symbol')) {
        selectedDisplayOptions.push('symbol');
    }

    const resultsContainer = document.getElementById('results_container');
    if (!resultsContainer) {
        console.error('Results container not found.');
        return;
    }

    resultsContainer.innerHTML = '<p>Loading results...</p>';

    try {
        // Build query parameters
        const params = new URLSearchParams({
            entity: 'companies',
            name: nameInput,
            industry: industryInput,
            location: cityInput,
            min_price2: minPrice,
            max_price2: maxPrice,
            min_market_value2: minMarketValue,
            max_market_value2: maxMarketValue,
            min_shares2: minShares,
            max_shares2: maxShares,
            display_fields: selectedDisplayOptions.join(','), // Send display options as a comma-separated string
        });

        console.log(`Query parameters for companies: ${params.toString()}`); // Debugging

        // Fetch results
        const response = await fetch(`/search?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Check and display results
        if (data.error) {
            resultsContainer.innerHTML = `<p>Error: ${data.error}</p>`;
        } else if (data.length === 0) {
            resultsContainer.innerHTML = '<p>No results found for the specified criteria.</p>';
        } else {
            resultsContainer.innerHTML = data
                .map((item) => {
                    let result = '';
                    if (selectedDisplayOptions.includes('name')) {
                        result += `<strong>Company Name:</strong> ${item.name || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('symbol')) {
                        result += `<strong>Symbol:</strong> ${item.symbol || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('location')) {
                        result += `<strong>Location:</strong> ${item.location || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('ceo_name')) {
                        result += `<strong>CEO Name:</strong> ${item.ceo_name || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('industry')) {
                        result += `<strong>Industry:</strong> ${item.industry || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('company_info')) {
                        result += `<strong>Company Info:</strong> ${item.company_info || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('year_end_price2')) {
                        result += `<strong>Year-End Price:</strong> $${item.year_end_price2 || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('year_end_shares2')) {
                        result += `<strong>Year-End Shares:</strong> ${new Intl.NumberFormat().format(item.year_end_shares2) || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('year_end_market_value2')) {
                        result += `<strong>Year-End Market Value:</strong> $${new Intl.NumberFormat().format(item.year_end_market_value2) || '<i>Not Available</i>'}<br>`;
                    }
                    
                    return `<div class="result-item">${result}</div><hr>`;
                })
                .join('');
        }
    } catch (error) {
        console.error(error); // Debugging
        resultsContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}




// Function to lock in the selected filters and display results in the results_container for Banks
async function lockInSearchBanks() {
    console.log("Lock In Search for Banks triggered"); // Debugging

    // Collect filter values
    const nameInput = document.getElementById('bank-search-input')?.value.trim() || ''; // Bank name input
    const locationInput = document.getElementById('location-dropdown')?.value || ''; // Selected location
    const industryInput = document.getElementById('industry-dropdown')?.value || ''; // Selected industry

    // Collect selected display preferences
    const displayPreferences = Array.from(
        document.querySelectorAll('input[name="bank_display_option"]:checked')
    ).map(option => option.value);

    const resultsContainer = document.getElementById('results_container');
    if (!resultsContainer) {
        console.error('Results container not found.');
        return;
    }

    resultsContainer.innerHTML = '<p>Loading results...</p>';

    try {
        // Build query parameters
        const params = new URLSearchParams({
            entity: 'investment_banks',
            name: nameInput,
            headquarters_location: locationInput,
            industry: industryInput,
            display_fields: displayPreferences.join(','), // Send selected display preferences as a comma-separated string
        });

        console.log(`Query parameters for banks: ${params.toString()}`); // Debugging

        // Fetch results
        const response = await fetch(`/search?${params.toString()}`);
        const data = await response.json();

        // Check and display results
        if (data.error) {
            resultsContainer.innerHTML = `<p>Error: ${data.error}</p>`;
        } else if (data.length === 0) {
            resultsContainer.innerHTML = '<p>No results found for the specified criteria.</p>';
        } else {
            // Render the results dynamically based on selected display fields
            resultsContainer.innerHTML = data
                .map((item) => {
                    let resultHTML = '<div class="result-item">';
                    if (displayPreferences.includes('name')) {
                        resultHTML += `<strong>Name:</strong> ${item.name || 'N/A'}<br>`;
                    }
                    if (displayPreferences.includes('location')) {
                        resultHTML += `<strong>Location:</strong> ${item.headquarters_location || 'N/A'}<br>`;
                    }
                    if (displayPreferences.includes('industries')) {
                        resultHTML += `<strong>Industries:</strong> ${item.industries || 'N/A'}<br>`;
                    }
                    if (displayPreferences.includes('ceo_name')) {
                        resultHTML += `<strong>CEO Name:</strong> ${item.ceo_name || 'N/A'}<br>`;
                    }
                    if (displayPreferences.includes('foundation_date')) {
                        resultHTML += `<strong>Foundation Date:</strong> ${item.foundation_date || 'N/A'}<br>`;
                    }
                    resultHTML += '</div><hr>';
                    return resultHTML;
                })
                .join('');
        }
    } catch (error) {
        console.error("Error during search:", error); // Debugging
        resultsContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}


async function lockInSearchManagers() {
    console.log("Lock In Search for Managers triggered"); // Debugging

    // Collect filter values
    const nameInput = document.getElementById('manager-search-input')?.value.trim() || ''; // Manager name input
    const selectedInvestmentFirm = document.getElementById('investment-firm-dropdown')?.value || ''; // Selected investment firm
    const minYearsExperience = document.getElementById('min-years-experience')?.value || 0; // Min years of experience
    const maxYearsExperience = document.getElementById('max-years-experience')?.value || 50; // Max years of experience

    // Collect selected display fields
    const selectedDisplayFields = Array.from(
        document.querySelectorAll('input[name="manager_display_option"]:checked')
    ).map((option) => option.value);

    // Ensure default display options if none are selected
    if (selectedDisplayFields.length === 0) {
        selectedDisplayFields.push('name', 'investment_firm', 'years_experience', 'personal_intro_text', 'portfolio', 'id');
    }

    const resultsContainer = document.getElementById('results_container');
    if (!resultsContainer) {
        console.error('Results container not found.');
        return;
    }

    // Display a loading message
    resultsContainer.innerHTML = '<p>Loading results...</p>';

    try {
        // Build query parameters
        const params = new URLSearchParams({
            entity: 'managers',
            name: nameInput,
            investment_firm_name: selectedInvestmentFirm,
            min_years_experience: minYearsExperience,
            max_years_experience: maxYearsExperience,
            display_fields: selectedDisplayFields.join(','), // Send display options as a comma-separated string
        });

        console.log(`Query parameters for managers: ${params.toString()}`); // Debugging

        // Fetch results from the backend
        const response = await fetch(`/search?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        // Check and display results
        if (data.error) {
            resultsContainer.innerHTML = `<p>Error: ${data.error}</p>`;
        } else if (data.length === 0) {
            resultsContainer.innerHTML = '<p>No results found for the specified criteria.</p>';
        } else {
            // Render the results dynamically based on selected display fields
            resultsContainer.innerHTML = data
                .map((item) => {
                    let result = '';
                    if (selectedDisplayFields.includes('name')) {
                        result += `<strong>Name:</strong> ${item.name || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayFields.includes('investment_firm')) {
                        result += `<strong>Investment Firm:</strong> ${item.investment_firm_name || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayFields.includes('years_experience')) {
                        result += `<strong>Years of Experience:</strong> ${item.years_experience || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayFields.includes('personal_intro_text')) {
                        result += `<strong>Intro:</strong> ${item.personal_intro || '<i>Not Available</i>'}<br>`;
                    }
                    if (selectedDisplayFields.includes('portfolio')) {
                        result += `<strong>Portfolio:</strong> ${item.portfolio_owned || '<i>Not Available</i>'}<br>`;
                    }
                    return `<div class="result-item">${result}</div><hr>`;
                })
                .join('');
        }
    } catch (error) {
        console.error("Error during search:", error); // Debugging
        resultsContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}



async function lockInSearchPortfolios() {
    console.log("Lock In Search for Portfolios triggered"); // Debugging

    // Collect filter values
    const stockSymbol = document.getElementById('stock-symbol-input')?.value.trim() || ''; // Stock symbol input
    const minMarketValue = (document.getElementById('min-market-value')?.value || 0) * 1_000_000; // Convert millions
    const maxMarketValue = (document.getElementById('max-market-value')?.value || 1_000) * 1_000_000; // Convert millions
    const minHolders = document.getElementById('min-holders')?.value || 0;
    const maxHolders = document.getElementById('max-holders')?.value || 10_000;

    // Collect selected display options
    const selectedDisplayOptions = Array.from(
        document.querySelectorAll('input[name="portfolio-display-option"]:checked')
    ).map((option) => option.value);

    // Ensure at least one display option is selected
    if (selectedDisplayOptions.length === 0) {
        console.error('No display options selected.');
        alert('Please select at least one display option.');
        return;
    }

    const resultsContainer = document.getElementById('results_container');
    if (!resultsContainer) {
        console.error('Results container not found.');
        return;
    }

    resultsContainer.innerHTML = '<p>Loading results...</p>';

    try {
        // Build query parameters
        const params = new URLSearchParams({
            entity: 'portfolios',
            stock_symbol: stockSymbol,
            min_market_value: minMarketValue,
            max_market_value: maxMarketValue,
            min_holders: minHolders,
            max_holders: maxHolders,
            display_fields: selectedDisplayOptions.join(','), // Send display options as a comma-separated string
        });

        console.log(`Query parameters for portfolios: ${params.toString()}`); // Debugging

        // Fetch results
        const response = await fetch(`/search?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data); // Debugging

        // Check and display results
        if (data.error) {
            resultsContainer.innerHTML = `<p>Error: ${data.error}</p>`;
        } else if (data.length === 0) {
            resultsContainer.innerHTML = '<p>No results found for the specified criteria.</p>';
        } else {
            resultsContainer.innerHTML = data
                .map((item) => {
                    let result = '';
                    if (selectedDisplayOptions.includes('portfolio_name')) {
                        result += `<strong>Portfolio Name:</strong> ${item.portfolio_name || 'N/A'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('stock')) {
                        result += `<strong>Portfolio Content:</strong> ${item.stock_list || 'N/A'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('foundation_date')) {
                        result += `<strong>Date of Foundation:</strong> ${item.foundation_date || 'N/A'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('companies_managed')) {
                        result += `<strong>Companies Managed:</strong> ${item.companies_managed || 'N/A'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('manager')) {
                        result += `<strong>Manager:</strong> ${item.manager || 'N/A'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('holders')) {
                        result += `<strong>Number of Holders:</strong> ${item.holders || 'N/A'}<br>`;
                    }
                    if (selectedDisplayOptions.includes('year_end_market_value')) {
                        result += `<strong>Year-End Market Value:</strong> $${item.year_end_market_value?.toLocaleString() || 'N/A'}<br>`;
                    }
                    return `<div class="result-item">${result}</div><hr>`;
                })
                .join('');
        }
    } catch (error) {
        console.error("Error during search:", error); // Debugging
        resultsContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}





// update Display Preferences
function updateDisplayPreferences(entity) {
    // Find all display options related to the given entity
    const checkboxes = document.querySelectorAll(`input[name="${entity}_display_option"]:checked`);

    // Map the checked checkboxes to their values
    const selectedOptions = Array.from(checkboxes).map((checkbox) => checkbox.value);

    console.log(`Selected Display Preferences for ${entity}:`, selectedOptions); // Debugging
    return selectedOptions;
}


// Utility function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Dropdown toggle functionality
document.querySelector('.dropbtn').addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent click event from propagating to the document
    const dropdown = document.querySelector('.dropdown-content');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
});

function hideDropdownAndShowWelcomePage(event) {
    // Get the dropdown menu and sidebars
    const dropdown = document.querySelector('.dropdown-content');
    const sidebars = document.querySelectorAll('.left-sidebar');
    
    // Check if the clicked element is inside the dropdown or any sidebar
    const isClickInsideDropdown = dropdown.contains(event.target);
    const isClickInsideSidebar = Array.from(sidebars).some(sidebar => sidebar.contains(event.target));

    // If clicked outside dropdown and sidebars
    if (!isClickInsideDropdown && !isClickInsideSidebar) {
        // Hide dropdown
        dropdown.style.display = 'none';

        // Reset to the welcome page
        const resultsContainer = document.getElementById('results_container');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <h2>Welcome</h2>
                <p>Select an option from the menu above to get started.</p>
            `;
        }

        // Hide all sidebars
        sidebars.forEach(sidebar => sidebar.classList.add('hidden'));
    }
}

// Attach the event listener to the document
document.addEventListener('click', hideDropdownAndShowWelcomePage);

function handleDropdownOption(entity) {
    // Call the existing function to display the correct content
    showWindow(entity);
    const searchWrapper = document.getElementById('entity-search-wrapper');
    const resultsContainer = document.getElementById('results_container');

    // Hide the dropdown menu
    const dropdown = document.querySelector('.dropdown-content');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    if (entity === 'Search by Entity') {
        // Hide the results container
        document.getElementById('results_container').classList.add('hidden');

        // Show the entity search wrapper
        const searchWrapper = document.getElementById('entity-search-wrapper');
        resultsContainer.classList.add('hidden');
        searchWrapper.classList.remove('hidden');
        searchWrapper.classList.add('visible'); // Optional: Add a visible class for styling

        // Additional behavior, if needed
        console.log('Search by entity option selected');
    }else{
        searchWrapper.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
    }
}

function selectAllCheckboxes(entity) {
    const sgpl = {
        "stocks": "stock",
        "companies": "company",
        "portfolios": "portfolio",
        "banks": "bank",
        "managers": "manager"
    };
    const entity_sg = sgpl[entity];
    // Get the "Select All" checkbox
    const selectAllCheckbox = document.getElementById(`${entity}-select-all`);
    // Get all checkboxes within the same sidebar
    const checkboxes = document.querySelectorAll(`#left-sidebar-${entity} input[type="checkbox"][name="${entity_sg}_display_option"]`);
    
    // Set each checkbox's checked state to match the "Select All" checkbox
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}


async function handleEntitySearch() {
    console.log("Entity Search triggered"); // Debugging

    const entitySetNameInput = document.getElementById('entity-set-name');
    const entityNameInput = document.getElementById('entity-name');
    const resultsContainer = document.getElementById('results_container');

    if (!resultsContainer) {
        console.error('Results container not found.');
        return;
    }

    // Validate input
    const entitySetName = entitySetNameInput.value.trim();
    const name = entityNameInput.value.trim();

    if (!entitySetName) {
        alert('Please enter an entity_set_name.');
        return;
    }

    if (!name) {
        alert('Please enter a name to search.');
        return;
    }

    // Show a loading message
    resultsContainer.innerHTML = '<p>Loading results...</p>';

    try {
        // Build query parameters
        const params = new URLSearchParams({
            entity: "searching_for",
            entity_set_name: entitySetName,
            name: name
        });

        console.log(`Query parameters: ${params.toString()}`); // Debugging

        // Fetch results from the server
        const response = await fetch(`/search?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data); // Debugging

        // Check and display results
        if (data.error) {
            resultsContainer.innerHTML = `<p>Error: ${data.error}</p>`;
        } else if (data.length === 0) {
            resultsContainer.innerHTML = '<p>No results found for the specified criteria.</p>';
        } else {
            // Display the data in a simple structured format
            resultsContainer.innerHTML = data.map(item => {
                let content = '<table class="result-table">';
                // Loop through each key-value pair in the item
                for (const [key, value] of Object.entries(item)) {
                    content += `
                        <tr>
                            <td><strong>${key}:</strong></td>
                            <td>${value !== null && value !== undefined ? value : 'N/A'}</td>
                        </tr>
                    `;
                }
                content += '</table>';
                return `<div class="result-item">${content}</div><hr>`;
            }).join('');
        }
    } catch (error) {
        console.error("Error during search:", error); // Debugging
        resultsContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}





