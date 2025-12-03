// static/script.js
let analysisChart = null;
let selectedStartDate = null;
let selectedEndDate = null;
let currentMonth = new Date().getMonth();
let currentYear = 2005; // По умолчанию 2005
let selectedInterval = '15min';

// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    loadAvailableDates();
    setupEventListeners();
    
    // Устанавливаем год по умолчанию
    document.getElementById('year-display').value = currentYear;
    
    // Загружаем календарь
    loadCalendar();
});

// Загрузка доступных дат
async function loadAvailableDates() {
    try {
        const response = await fetch('/api/available-dates');
        const data = await response.json();
        
        if (data.error) {
            console.error('Ошибка загрузки дат:', data.error);
            return;
        }
        
        // Устанавливаем начальные даты из доступного диапазона
        const minDate = new Date(data.min_date);
        currentYear = 2005; // Фиксируем 2005 год
        currentMonth = minDate.getMonth();
        
    } catch (error) {
        console.error('Ошибка загрузки дат:', error);
    }
}

// Загрузка календаря
async function loadCalendar() {
    try {
        const response = await fetch(`/api/calendar/${currentYear}/${currentMonth + 1}`);
        const data = await response.json();
        
        if (data.error) {
            console.error('Ошибка загрузки календаря:', data.error);
            return;
        }
        
        // Обновляем заголовок месяца
        document.getElementById('calendar-header').textContent = 
            data.month_name;
        
        // Обновляем год
        document.getElementById('year-display').value = currentYear;
        
        // Генерируем календарь
        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';
        
        data.weeks.forEach(week => {
            week.forEach(day => {
                const dayElement = document.createElement('div');
                
                if (day === null) {
                    dayElement.className = 'calendar-day empty';
                    dayElement.innerHTML = '';
                } else {
                    dayElement.className = 'calendar-day';
                    dayElement.textContent = day.day;
                    dayElement.dataset.date = day.date;
                    
                    // Убираем точки под датами
                    // dayElement.classList.add('has-data'); // Убираем эту строку
                    
                    // Проверяем, выбрана ли дата
                    if (selectedStartDate && day.date === selectedStartDate) {
                        dayElement.classList.add('selected');
                    } else if (selectedEndDate && day.date === selectedEndDate) {
                        dayElement.classList.add('selected');
                    } else if (isDateInRange(day.date)) {
                        dayElement.classList.add('range');
                    }
                    
                    dayElement.addEventListener('click', () => selectDate(day.date));
                }
                
                calendarGrid.appendChild(dayElement);
            });
        });
        
        updateDateDisplay();
        
    } catch (error) {
        console.error('Ошибка загрузки календаря:', error);
    }
}

// Изменение месяца
function changeMonth(delta) {
    currentMonth += delta;
    
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    loadCalendar();
}

// Изменение года
function changeYear() {
    const yearInput = document.getElementById('year-display');
    const newYear = parseInt(yearInput.value);
    
    if (!isNaN(newYear) && newYear >= 2000 && newYear <= 2100) {
        currentYear = newYear;
        loadCalendar();
    } else {
        yearInput.value = currentYear; // Возвращаем предыдущее значение
    }
}

// Выбор даты
function selectDate(date) {
    if (!selectedStartDate) {
        selectedStartDate = date;
    } else if (!selectedEndDate) {
        if (new Date(date) >= new Date(selectedStartDate)) {
            selectedEndDate = date;
        } else {
            selectedEndDate = selectedStartDate;
            selectedStartDate = date;
        }
    } else {
        selectedStartDate = date;
        selectedEndDate = null;
    }
    
    loadCalendar();
    updateDateDisplay();
}

// Проверка даты в диапазоне
function isDateInRange(date) {
    if (!selectedStartDate || !selectedEndDate) return false;
    
    const checkDate = new Date(date);
    const startDate = new Date(selectedStartDate);
    const endDate = new Date(selectedEndDate);
    
    return checkDate >= startDate && checkDate <= endDate;
}

// Обновление отображения дат
function updateDateDisplay() {
    const selectedRange = document.getElementById('selected-range');
    
    if (selectedStartDate && selectedEndDate) {
        const start = formatDate(selectedStartDate);
        const end = formatDate(selectedEndDate);
        selectedRange.innerHTML = `<strong>Выбран период: ${start} → ${end}</strong>`;
    } else if (selectedStartDate) {
        selectedRange.innerHTML = `<strong>Выбрана дата: ${formatDate(selectedStartDate)}</strong>`;
    } else {
        selectedRange.innerHTML = `<small>Выберите даты в календаре</small>`;
    }
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Автоматическое время
    const autoTimeToggle = document.getElementById('auto-time');
    const timeInputs = document.getElementById('time-inputs');
    
    autoTimeToggle.addEventListener('change', function() {
        timeInputs.style.display = this.checked ? 'none' : 'grid';
    });
    
    // Интервалы свечей
    document.querySelectorAll('.interval-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.interval-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedInterval = this.dataset.interval;
            document.getElementById('interval-display').textContent = selectedInterval;
        });
    });
    
    // Поле года
    const yearInput = document.getElementById('year-display');
    yearInput.addEventListener('blur', changeYear);
    yearInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            changeYear();
        }
    });
}

// Запуск анализа
async function runAnalysis() {
    if (!selectedStartDate || !selectedEndDate) {
        alert('Пожалуйста, выберите начальную и конечную даты');
        return;
    }
    
    const analyzeBtn = document.querySelector('.analyze-btn');
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '<span class="icon">⏳</span><span>Анализ...</span>';
    analyzeBtn.disabled = true;
    
    try {
        const autoTime = document.getElementById('auto-time').checked;
        const startTime = autoTime ? "09:30" : document.getElementById('start-time').value;
        const endTime = autoTime ? "16:00" : document.getElementById('end-time').value;
        
        const requestData = {
            start_date: selectedStartDate,
            end_date: selectedEndDate,
            start_time: startTime,
            end_time: endTime,
            interval: selectedInterval,
            use_auto_time: autoTime
        };
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Ошибка анализа');
        }
        
        // Обновляем статистику
        document.getElementById('model-count').textContent = data.model_count;
        document.getElementById('history-count').textContent = data.historical_count;
        document.getElementById('interval-display').textContent = selectedInterval;
        document.getElementById('period-display').textContent = 
            `${formatDate(data.period.start)} - ${formatDate(data.period.end)}`;
        
        // Создаём график
        createAnalysisChart(data.model_candles, data.historical_candles);
        
        // Показываем уведомление
        showNotification('Анализ завершен успешно!', 'success');
        
    } catch (error) {
        console.error('Ошибка анализа:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    } finally {
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
    }
}

// Создание графика анализа
function createAnalysisChart(modelCandles, historicalCandles) {
    const ctx = document.getElementById('analysis-chart').getContext('2d');
    
    // Удаляем старый график
    if (analysisChart) {
        analysisChart.destroy();
    }
    
    // Подготавливаем данные
    const modelData = modelCandles.map(candle => ({
        x: new Date(candle.time),
        o: candle.open,
        h: candle.high,
        l: candle.low,
        c: candle.close
    }));
    
    const historicalData = historicalCandles.map(candle => ({
        x: new Date(candle.time),
        o: candle.open,
        h: candle.high,
        l: candle.low,
        c: candle.close
    }));
    
    // Создаём график
    analysisChart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [
                {
                    label: 'Модель',
                    data: modelData,
                    color: {
                        up: '#71BC78',  // Ваш зеленый для роста
                        down: '#dc3545', // Красный для падения
                        unchanged: '#6c757d'
                    },
                    borderColor: '#71BC78',
                    borderWidth: 1,
                    backgroundColor: 'rgba(113, 188, 120, 0.1)'
                },
                {
                    label: 'Исторические данные',
                    data: historicalData,
                    color: {
                        up: 'rgba(113, 188, 120, 0.3)',
                        down: 'rgba(220, 53, 69, 0.3)',
                        unchanged: 'rgba(108, 117, 125, 0.3)'
                    },
                    borderColor: 'rgba(113, 188, 120, 0.5)',
                    borderWidth: 0.5,
                    backgroundColor: 'rgba(113, 188, 120, 0.05)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 10,
                        font: {
                            size: 12,
                            family: 'Calibri, sans-serif'
                        }
                    }
                },
                tooltip: {
                    position: 'nearest',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#212529',
                    bodyColor: '#212529',
                    borderColor: '#71BC78',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const point = context.raw;
                            return [
                                `${datasetLabel}`,
                                `Open: $${point.o.toFixed(2)}`,
                                `High: $${point.h.toFixed(2)}`,
                                `Low: $${point.l.toFixed(2)}`,
                                `Close: $${point.c.toFixed(2)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'dd.MM.yy'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#6c757d',
                        font: {
                            family: 'Calibri, sans-serif'
                        }
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#6c757d',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        },
                        font: {
                            family: 'Calibri, sans-serif'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Цена ($)',
                        color: '#6c757d',
                        font: {
                            family: 'Calibri, sans-serif',
                            weight: 'normal'
                        }
                    }
                }
            },
            animation: {
                duration: 500
            }
        }
    });
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 16px;
        background: ${type === 'success' ? '#71BC78' : '#dc3545'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        font-family: Calibri, sans-serif;
        font-weight: 300;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Emoji для действий
function getActionEmoji(action) {
    switch(action) {
        case 'BUY': return '📈';
        case 'SELL': return '📉';
        case 'HOLD': return '⚖️';
        default: return '❓';
    }
}

// Стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);