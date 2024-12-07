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

// Placeholder for search functionality
function search(category) {
    const input = document.getElementById(`search_${category}`);
    const resultsDiv = document.getElementById(`results_${category}`);
    const query = input.value.trim();

    if (query) {
        resultsDiv.innerHTML = `<p>Searching for "${query}" in ${category}...</p>`;
        // TODO: Add API call or backend integration to fetch actual results
    } else {
        resultsDiv.innerHTML = `<p>Please enter a search term.</p>`;
    }
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

