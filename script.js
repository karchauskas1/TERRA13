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
        console.log('=== CONFIRM BUTTON CLICKED ===');
        console.log('selectedTable:', selectedTable, 'selectedZone:', selectedZone);

        // Переинициализируем, если Telegram вдруг не был доступен при загрузке
        initTelegram();
        console.log('Telegram WebApp re-initialized');

        if (!selectedTable || !selectedZone) {
            console.warn('No table or zone selected');
            if (!isTelegramWebApp) {
                alert('Пожалуйста, выберите стол');
            }
            return;
        }

        const data = {
            table_id: selectedTable,
            zone: selectedZone
        };

        console.log('Data to send:', data);
        console.log('isTelegramWebApp:', isTelegramWebApp);
        console.log('window.Telegram:', !!window.Telegram);
        console.log('window.Telegram.WebApp:', !!(window.Telegram && window.Telegram.WebApp));
        console.log('window.Telegram.WebApp.sendData:', !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.sendData));

        // Если не в Telegram WebApp, выводим минимальное предупреждение
        if (!isTelegramWebApp) {
            console.warn('Not in Telegram WebApp - cannot send data');
            alert('Откройте ссылку из Telegram, чтобы отправить бронирование.');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Подтвердить выбор';
            return;
        }

        // Отключаем кнопку, чтобы предотвратить повторные нажатия
        confirmBtn.disabled = true;
        const originalText = confirmBtn.textContent;
        confirmBtn.textContent = 'Отправка...';
        console.log('Button disabled, starting send process');

        try {
            const dataString = JSON.stringify(data);
            console.log('JSON string:', dataString);

            // Проверяем доступность sendData непосредственно перед вызовом
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.sendData) {
                console.log('Calling sendData...');
                window.Telegram.WebApp.sendData(dataString);
                console.log('sendData called successfully - WebApp should close automatically');

                // sendData() автоматически закрывает WebApp, но добавим резервный таймер
                setTimeout(() => {
                    console.log('Checking WebApp status after sendData...');
                    if (window.Telegram && window.Telegram.WebApp) {
                        console.log('WebApp.closed:', window.Telegram.WebApp.closed);
                        if (!window.Telegram.WebApp.closed) {
                            console.log('WebApp still open, closing manually...');
                            window.Telegram.WebApp.close();
                        } else {
                            console.log('WebApp already closed');
                        }
                    } else {
                        console.warn('Telegram.WebApp not available for status check');
                    }
                }, 200);
            } else {
                throw new Error('Telegram.WebApp.sendData is not available');
            }

        } catch (error) {
            console.error('Error in send process:', error);
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
            alert('Ошибка отправки данных: ' + error.message + '\n\nПопробуйте еще раз.');
        }
    });
});
