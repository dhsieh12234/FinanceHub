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
