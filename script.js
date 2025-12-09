// Инициализация Telegram WebApp
let isTelegramWebApp = false;

if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    isTelegramWebApp = true;
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
    console.log('Telegram WebApp initialized');
} else {
    console.warn('Telegram WebApp not available - running in browser mode');
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
    if (!selectedTable || !selectedZone) {
        if (!isTelegramWebApp) {
            alert('Пожалуйста, выберите стол');
        }
        return;
    }
    
    const data = {
        table_id: selectedTable,
        zone: selectedZone
    };
    
    console.log('Confirm button clicked, selected:', data);
    console.log('isTelegramWebApp:', isTelegramWebApp);
    
    // Если не в Telegram WebApp, показываем alert только для тестирования
    if (!isTelegramWebApp) {
        console.log('Not in Telegram WebApp - showing alert for testing');
        alert(`Выбран стол ${selectedTable} в ${selectedZone}\n\n(Веб-приложение работает вне Telegram)`);
        return;
    }
    
    // Отключаем кнопку, чтобы предотвратить повторные нажатия
    confirmBtn.disabled = true;
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Отправка...';
    
    try {
        const dataString = JSON.stringify(data);
        console.log('Sending data to bot:', dataString);
        console.log('Telegram.WebApp available:', typeof Telegram !== 'undefined' && Telegram.WebApp);
        
        // Отправляем данные в бот
        if (Telegram.WebApp && Telegram.WebApp.sendData) {
            Telegram.WebApp.sendData(dataString);
            console.log('Data sent via Telegram.WebApp.sendData()');
            
            // Закрываем приложение
            // Telegram автоматически закроет приложение после получения данных ботом
            setTimeout(() => {
                if (Telegram.WebApp && Telegram.WebApp.close) {
                    Telegram.WebApp.close();
                    console.log('WebApp closed');
                }
            }, 100);
        } else {
            throw new Error('Telegram.WebApp.sendData is not available');
        }
        
    } catch (error) {
        console.error('Error sending data:', error);
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
        alert('Ошибка отправки данных: ' + error.message + '\n\nПопробуйте еще раз.');
    }
});
