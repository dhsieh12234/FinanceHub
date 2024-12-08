// Function to show the appropriate window
function showWindow(entity) {
    console.log(`showWindow called for: ${entity}`); // Debugging
    const resultsContainer = document.getElementById('results_container');

    // Ensure the container exists
    if (!resultsContainer) {
        console.error('results_container not found.');
        return;
    }

    // Dynamically create the search interface for the selected entity
    resultsContainer.innerHTML = `
        <h2>Search ${capitalizeFirstLetter(entity)}</h2>
        <input type="text" id="search_${entity}" placeholder="Enter ${entity.replace('_', ' ')} name to search">
        <button onclick="search('${entity}')">Search</button>
        <div id="results_${entity}" class="results"></div>
    `;

    // Toggle the sidebar visibility based on the selected entity
    const sidebar = document.getElementById('left-sidebar');
    if (entity === 'stocks') {
        sidebar.classList.remove('hidden'); // Show sidebar
    } else {
        sidebar.classList.add('hidden'); // Hide sidebar
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

    const minPrice = minPriceInput.value ? parseFloat(minPriceInput.value) : 0;
    const maxPrice = maxPriceInput.value ? parseFloat(maxPriceInput.value) : 1200;

    // Ensure valid input: min price cannot exceed max price
    if (minPrice > maxPrice) {
        maxPriceInput.value = minPrice; // Adjust max to match min
    }

    // Update the displayed range
    priceRangeDisplay.textContent = `$${minPrice} - $${maxPrice}`;
}

// Function to update displayed year-end total number of shares range
function updateValueRange() {
    const minSharesInput = document.getElementById('min_shares');
    const maxSharesInput = document.getElementById('max_shares');
    const sharesRangeDisplay = document.getElementById('shares-range-value');

    const minShares = minSharesInput.value ? parseFloat(minSharesInput.value) : 0;
    const maxShares = maxSharesInput.value ? parseFloat(maxSharesInput.value) : 4000;

    // Ensure valid input: min shares cannot exceed max shares
    if (minShares > maxShares) {
        maxSharesInput.value = minShares; // Adjust max to match min
    }

    // Update the displayed range
    sharesRangeDisplay.textContent = `${minShares} - ${maxShares} shares`;
}

// Function to update displayed year-end total number of shares range
function updateSharesRange() {
    const minSharesInput = document.getElementById('min_shares');
    const maxSharesInput = document.getElementById('max_shares');
    const sharesRangeDisplay = document.getElementById('shares-range-value');

    const minShares = minSharesInput.value ? parseFloat(minSharesInput.value) : 100;
    const maxShares = maxSharesInput.value ? parseFloat(maxSharesInput.value) : 15000;

    // Ensure valid input: min shares cannot exceed max shares
    if (minShares > maxShares) {
        maxSharesInput.value = minShares; // Adjust max to match min
    }

    // Update the displayed range
    sharesRangeDisplay.textContent = `${minShares} - ${maxShares} shares`;
}

// Function to lock in the selected filters and display results in the results_container
async function lockInSearch() {
    console.log("Lock In Search triggered");

    // Collect filter values
    const nameInput = document.getElementById('stock-search-input')?.value.trim() || ''; // Stock name input
    const minPrice = document.getElementById('min_price')?.value || 0;
    const maxPrice = document.getElementById('max_price')?.value || 1200;

    // Convert Market Value (Billions) to actual values
    const minMarketValue = (document.getElementById('min_market_value')?.value || 0) * 1_000_000_000; // Convert billions to actual value
    const maxMarketValue = (document.getElementById('max_market_value')?.value || 1000) * 1_000_000_000; // Convert billions to actual value

    // Convert Total Number of Shares (Millions) to actual values
    const minShares = (document.getElementById('min_shares')?.value || 100) * 1_000_000; // Convert millions to actual value
    const maxShares = (document.getElementById('max_shares')?.value || 15_000) * 1_000_000; // Convert millions to actual value

    // Update the results container with a loading message
    const resultsContainer = document.getElementById('results_container');
    if (!resultsContainer) {
        console.error('Results container not found.');
        return;
    }

    resultsContainer.innerHTML = '<p>Loading results...</p>';

    try {
        // Build query string with filter parameters
        const params = new URLSearchParams({
            entity: 'stocks',
            name: nameInput,
            min_price: minPrice,
            max_price: maxPrice,
            min_market_value: minMarketValue,
            max_market_value: maxMarketValue,
            min_shares: minShares,
            max_shares: maxShares,
        });

        // Call the backend API
        const response = await fetch(`/search?${params.toString()}`);
        const data = await response.json();

        // Handle errors or empty results
        if (data.error) {
            resultsContainer.innerHTML = `<p>Error: ${data.error}</p>`;
        } else if (data.length === 0) {
            resultsContainer.innerHTML = '<p>No results found for the specified criteria.</p>';
        } else {
            // Display the results dynamically
            resultsContainer.innerHTML = data
                .map(
                    (item) =>
                        `<div class="result-item">
                            <strong>${item.stock_code || 'N/A'}</strong>: ${item.name || 'N/A'}<br>
                            Year-End Price: $${item.year_end_price || 'N/A'}<br>
                            Market Value: $${item.year_end_market_value || 'N/A'}<br>
                            Total Shares: ${item.year_end_shares || 'N/A'}
                        </div>`
                )
                .join('');
        }
    } catch (error) {
        resultsContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}





// Utility function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


