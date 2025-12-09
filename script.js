// Check if Telegram WebApp is available
if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

let selectedTable = null;
let selectedZone = null;

// Get all table elements
const tables = document.querySelectorAll('.table');

// Add click handlers to tables
tables.forEach(table => {
    table.addEventListener('click', () => {
        // Remove previous selection
        tables.forEach(t => t.classList.remove('selected'));
        
        // Add selection to clicked table
        table.classList.add('selected');
        
        // Store selected table info
        selectedTable = table.getAttribute('data-table-id');
        selectedZone = table.getAttribute('data-zone');
        
        // Show confirmation section
        const selectedInfo = document.getElementById('selected-info');
        const selectedTableSpan = document.getElementById('selected-table');
        
        selectedInfo.classList.remove('hidden');
        selectedTableSpan.textContent = `Стол ${selectedTable} (${selectedZone})`;
    });
});

// Confirm button handler
const confirmBtn = document.getElementById('confirm-btn');
confirmBtn.addEventListener('click', () => {
    if (selectedTable && selectedZone) {
        const data = {
            table_id: selectedTable,
            zone: selectedZone
        };
        
        // Send data to Telegram bot
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.sendData(JSON.stringify(data));
            Telegram.WebApp.close();
        } else {
            // Fallback for testing
            console.log('Selected table:', data);
            alert(`Выбран стол ${selectedTable} в ${selectedZone}`);
        }
    } else {
        alert('Пожалуйста, выберите стол');
    }
});

