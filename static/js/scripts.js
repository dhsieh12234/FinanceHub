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
        <h2>Search ${entity}</h2>
        <input type="text" id="search_${entity}" placeholder="Enter ${entity} name to search">
        <button onclick="search('${entity}')">Search</button>
        <div id="results_${entity}" class="results"></div>
    `;
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

    resultsDiv.innerHTML = `<p>Searching for "${query}" in ${category}...</p>`;

    try {
        let firstname = true;
        let lastname = true;
        if (category === 'managers') {
            firstname = document.getElementById('search_firstname').checked;
            lastname = document.getElementById('search_lastname').checked;
        }
        // Call the backend API
        const response = await fetch(`/search?entity=${category}&name=${query}`);
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
        .map(([key, value]) => `<tr><td><strong>${key}</strong></td><td>${value}</td></tr>`)
        .join('');

    return `
        <table border="1" style="margin: 10px 0; width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
            <thead>
                <tr>
                    <th style="text-align: left; font-weight: bold;">Attribute</th>
                    <th style="text-align: left;">Content</th>
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
            resultsDiv.innerHTML = data
                .map(
                    stock =>
                        `<div><strong>${stock.stock_code}</strong>: ${stock.company_name} - Year-End Price: ${stock.year_end_price}</div>`
                )
                .join('');
        }
    } catch (error) {
        resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}



