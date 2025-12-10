document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram WebApp
    let isTelegramWebApp = false;

    const initTelegram = () => {
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            isTelegramWebApp = true;
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
            console.log('Telegram WebApp initialized');
        } else {
            console.warn('Telegram WebApp not available - running in browser mode');
        }
    };

    initTelegram();

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
        // Переинициализируем, если Telegram вдруг не был доступен при загрузке
        initTelegram();

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
        
        // Если не в Telegram WebApp, выводим минимальное предупреждение
        if (!isTelegramWebApp) {
            console.warn('Not in Telegram WebApp');
            alert('Откройте ссылку из Telegram, чтобы отправить бронирование.');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Подтвердить выбор';
            return;
        }
        
        // Отключаем кнопку, чтобы предотвратить повторные нажатия
        confirmBtn.disabled = true;
        const originalText = confirmBtn.textContent;
        confirmBtn.textContent = 'Отправка...';
        
        try {
            const dataString = JSON.stringify(data);
            console.log('Sending data to bot:', dataString);
            
            // Отправляем данные в бот
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.sendData) {
                console.log('Sending data to bot:', dataString);
                window.Telegram.WebApp.sendData(dataString);
                console.log('Data sent via Telegram.WebApp.sendData()');

                // sendData() автоматически закрывает WebApp, не нужно вызывать close()
                // Если данные не отправляются, попробуем подождать чуть-чуть
                setTimeout(() => {
                    console.log('Checking if WebApp is still open...');
                    if (window.Telegram && window.Telegram.WebApp && !window.Telegram.WebApp.closed) {
                        console.log('WebApp still open, closing manually');
                        window.Telegram.WebApp.close();
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
});
