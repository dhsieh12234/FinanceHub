// Function to show the appropriate window
function showWindow(windowId) {
    // Hide all windows
    const windows = document.querySelectorAll('.window');
    windows.forEach(window => window.classList.remove('active'));

    // Show the selected window
    const targetWindow = document.getElementById(windowId);
    if (targetWindow) {
        targetWindow.classList.add('active');
    }
}

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
            document.getElementById('main-content').style.display = 'block';
        } else {
            errorDiv.textContent = data.error || 'Invalid password.';
        }
    } catch (err) {
        errorDiv.textContent = 'Error connecting to the server.';
    }
}

