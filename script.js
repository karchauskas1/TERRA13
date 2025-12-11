document.addEventListener('DOMContentLoaded', () => {
    console.log('=== WEBAPP PAGE LOADED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User Agent:', navigator.userAgent);
    console.log('URL:', window.location.href);

    // Инициализация Telegram WebApp
    let isTelegramWebApp = false;

    const initTelegram = () => {
        console.log('=== INITIALIZING TELEGRAM WEBAPP ===');
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            isTelegramWebApp = true;
            console.log('✅ Telegram WebApp SDK found');
            console.log('WebApp version:', window.Telegram.WebApp.version);
            console.log('WebApp platform:', window.Telegram.WebApp.platform);
            console.log('WebApp initData:', window.Telegram.WebApp.initData);
            
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
            console.log('✅ Telegram WebApp initialized and expanded');
            
            // Добавляем обработчики событий
            window.Telegram.WebApp.onEvent('viewportChanged', () => {
                console.log('WebApp viewport changed');
            });
            
            window.Telegram.WebApp.onEvent('themeChanged', () => {
                console.log('WebApp theme changed');
            });
            
        } else {
            console.warn('❌ Telegram WebApp not available - running in browser mode');
            console.warn('window.Telegram:', typeof window.Telegram);
        }
    };

    initTelegram();

    let selectedTable = null;
    let selectedZone = null;
    let bookedTables = [];

    // Получение параметров из URL
    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get('date');
    const time = urlParams.get('time');
    const userId = urlParams.get('user_id');
    const gasApiUrl = urlParams.get('gas_api_url');
    const gasApiToken = urlParams.get('gas_api_token');

    console.log('URL parameters:', { date, time, userId, gasApiUrl: gasApiUrl ? 'present' : 'missing' });

    // Функция для получения забронированных столиков
    const fetchBookedTables = async () => {
        if (!date || !time) {
            console.warn('Date or time not provided, skipping booked tables check');
            return;
        }

        if (!gasApiUrl || !gasApiToken) {
            console.warn('GAS API URL or token not provided, skipping booked tables check');
            return;
        }

        try {
            console.log('Fetching booked tables for date:', date, 'time:', time);
            
            // Запрос к GAS API
            const apiUrl = `${gasApiUrl}?action=get_booked_tables&token=${encodeURIComponent(gasApiToken)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`;
            
            console.log('API URL (sanitized):', apiUrl.replace(/token=[^&]+/, 'token=***'));
            
            const response = await fetch(apiUrl);
            const result = await response.json();
            
            console.log('Booked tables response:', result);
            
            if (result.ok && result.booked_tables) {
                bookedTables = result.booked_tables.map(t => t.toString());
                console.log('Booked tables:', bookedTables);
                updateTableAvailability();
            } else {
                console.warn('Failed to get booked tables:', result.error);
            }
        } catch (error) {
            console.error('Error fetching booked tables:', error);
            // Продолжаем работу, просто не блокируем столики
        }
    };

    // Функция для обновления доступности столиков
    const updateTableAvailability = () => {
        const tables = document.querySelectorAll('.table');
        tables.forEach(table => {
            const tableId = table.getAttribute('data-table-id');
            if (bookedTables.includes(tableId)) {
                table.classList.add('booked');
                table.classList.remove('selected');
                table.style.cursor = 'not-allowed';
                console.log(`Table ${tableId} is booked`);
            } else {
                table.classList.remove('booked');
                table.style.cursor = 'pointer';
            }
        });
    };

    // Загружаем забронированные столики при загрузке страницы
    if (date && time) {
        fetchBookedTables();
    }

    // Get all table elements
    const tables = document.querySelectorAll('.table');

    // Add click handlers to tables
    console.log(`Found ${tables.length} tables to add click handlers`);
    tables.forEach(table => {
        table.addEventListener('click', () => {
            console.log('=== TABLE CLICKED ===');
            const tableId = table.getAttribute('data-table-id');
            const zone = table.getAttribute('data-zone');
            console.log('Clicked table ID:', tableId);
            console.log('Clicked table zone:', zone);
            
            // Проверяем, не занят ли стол
            if (bookedTables.includes(tableId)) {
                console.warn('Table is booked, cannot select');
                alert('Этот стол уже забронирован на выбранное время. Пожалуйста, выберите другой стол.');
                return;
            }
            
            // Remove previous selection
            tables.forEach(t => t.classList.remove('selected'));
            
            // Add selection to clicked table
            table.classList.add('selected');
            
            // Store selected table info
            selectedTable = tableId;
            selectedZone = zone;
            console.log('Selected table stored:', selectedTable, selectedZone);
            
            // Show confirmation section
            const selectedInfo = document.getElementById('selected-info');
            const selectedTableSpan = document.getElementById('selected-table');
            
            if (selectedInfo && selectedTableSpan) {
                selectedInfo.classList.remove('hidden');
                selectedTableSpan.textContent = `Стол ${selectedTable} (${selectedZone})`;
                console.log('Confirmation section shown');
            } else {
                console.error('Cannot find selected-info or selected-table elements');
            }
        });
    });

    // Confirm button handler
    const confirmBtn = document.getElementById('confirm-btn');
    let isSending = false; // Флаг для предотвращения повторной отправки
    
    confirmBtn.addEventListener('click', () => {
        console.log('=== CONFIRM BUTTON CLICKED ===');
        console.log('selectedTable:', selectedTable, 'selectedZone:', selectedZone);
        console.log('isSending:', isSending);

        // Предотвращаем повторную отправку
        if (isSending) {
            console.warn('Already sending, ignoring click');
            return;
        }

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

        // Убеждаемся, что table_id - строка
        const data = {
            table_id: String(selectedTable),
            zone: String(selectedZone)
        };

        console.log('=== PREPARING TO SEND DATA ===');
        console.log('Data to send:', data);
        console.log('Selected table:', selectedTable, 'type:', typeof selectedTable);
        console.log('Selected zone:', selectedZone, 'type:', typeof selectedZone);
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

        // Отключаем кнопку и устанавливаем флаг, чтобы предотвратить повторные нажатия
        isSending = true;
        confirmBtn.disabled = true;
        const originalText = confirmBtn.textContent;
        confirmBtn.textContent = 'Отправка...';
        console.log('Button disabled, starting send process');

        try {
            const dataString = JSON.stringify(data);
            console.log('=== JSON STRINGIFY ===');
            console.log('JSON string:', dataString);
            console.log('JSON string length:', dataString.length);
            console.log('JSON string type:', typeof dataString);
            
            // Проверяем, что JSON валидный
            try {
                const testParse = JSON.parse(dataString);
                console.log('✅ JSON is valid, parsed back:', testParse);
            } catch (e) {
                console.error('❌ JSON is invalid!', e);
                throw new Error('Invalid JSON data');
            }

            // ВАЖНО: Проверяем доступность sendData непосредственно перед вызовом
            console.log('=== CHECKING sendData AVAILABILITY ===');
            console.log('window.Telegram exists:', !!window.Telegram);
            console.log('window.Telegram.WebApp exists:', !!(window.Telegram && window.Telegram.WebApp));
            console.log('sendData type:', typeof (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.sendData));
            
            if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.sendData === 'function') {
                console.log('✅ sendData function is available, calling it...');
                console.log('Data to send (string):', dataString);
                console.log('Data length:', dataString.length, 'bytes');

                // Вызываем sendData с небольшой задержкой для надежности
                setTimeout(() => {
                    try {
                        console.log('=== EXECUTING sendData ===');
                        console.log('Timestamp:', new Date().toISOString());
                        console.log('Calling window.Telegram.WebApp.sendData()...');
                        
                        window.Telegram.WebApp.sendData(dataString);
                        
                        console.log('✅ sendData() called successfully - no errors thrown');
                        console.log('WebApp should close automatically now');

                        // sendData() должен автоматически закрыть WebApp
                        // Добавляем дополнительную проверку через 500мс
                        setTimeout(() => {
                            console.log('=== CHECKING WEBAPP STATUS AFTER 500ms ===');
                            if (window.Telegram && window.Telegram.WebApp) {
                                console.log('WebApp.closed:', window.Telegram.WebApp.closed);
                                if (!window.Telegram.WebApp.closed) {
                                    console.log('⚠️ WebApp still open after sendData, closing manually...');
                                    window.Telegram.WebApp.close();
                                    console.log('Manual close() called');
                                } else {
                                    console.log('✅ WebApp closed automatically');
                                }
                            } else {
                                console.warn('⚠️ Telegram.WebApp not available for status check');
                            }
                        }, 500);

                    } catch (sendError) {
                        console.error('❌ ERROR during sendData execution:', sendError);
                        console.error('Error name:', sendError.name);
                        console.error('Error message:', sendError.message);
                        console.error('Error stack:', sendError.stack);
                        
                        // Сбрасываем флаг и кнопку
                        isSending = false;
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = originalText;
                        
                        // Fallback: отправляем как обычное сообщение
                        if (window.Telegram && window.Telegram.WebApp) {
                            console.log('Trying fallback - closing WebApp manually');
                            window.Telegram.WebApp.close();
                        }
                        alert('Ошибка отправки данных. Попробуйте ввести номер стола вручную.');
                    }
                }, 100);

            } else {
                console.error('sendData function not available:', {
                    windowTelegram: !!window.Telegram,
                    webApp: !!(window.Telegram && window.Telegram.WebApp),
                    sendData: !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.sendData),
                    sendDataType: typeof (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.sendData)
                });
                throw new Error('Telegram.WebApp.sendData is not available');
            }

        } catch (error) {
            console.error('Error in send process:', error);
            isSending = false;
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
            alert('Ошибка отправки данных: ' + error.message + '\n\nПопробуйте ввести номер стола вручную.');
        }
    });
});
