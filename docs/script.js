// script.js - NVIDIA Trading Assistant
let analysisChart = null;
let selectedStartDate = null;
let selectedEndDate = null;
let currentMonth = new Date().getMonth();
let currentYear = 2005;
let selectedInterval = '15min';

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NVIDIA Trading Assistant загружен');
    
    // Настраиваем интерфейс
    setupEventListeners();
    document.getElementById('year-display').value = currentYear;
    loadCalendar();
    
    // Показываем инструкцию вместо графика
    showChartInstruction();
    
    // Обновляем статистику
    updateStats();
});

// Показать инструкцию в графике
function showChartInstruction() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    // Очищаем контейнер
    chartContainer.innerHTML = '';
    
    // Создаем canvas для графика
    const canvas = document.createElement('canvas');
    canvas.id = 'analysis-chart';
    chartContainer.appendChild(canvas);
    
    // Добавляем инструкцию поверх
    const instruction = document.createElement('div');
    instruction.className = 'chart-instruction';
    instruction.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 10;
        pointer-events: none;
    `;
    
    instruction.innerHTML = `
        <div style="color: #71BC78; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px;">📈</div>
            <h3 style="font-size: 24px; margin-bottom: 10px;">NVIDIA Trading Assistant</h3>
            <p style="color: #666; font-size: 16px;">
                Выберите период в календаре<br>и нажмите "Запустить анализ"
            </p>
        </div>
    `;
    
    chartContainer.appendChild(instruction);
}

// Загрузка календаря
function loadCalendar() {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    document.getElementById('calendar-header').textContent = months[currentMonth];
    
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    // Создаем дни календаря (1-31)
    for (let i = 1; i <= 31; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = i;
        
        // Добавляем обработчик клика
        dayElement.addEventListener('click', function() {
            selectDate(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
        });
        
        calendarGrid.appendChild(dayElement);
    }
    
    updateDateDisplay();
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
    
    document.getElementById('year-display').value = currentYear;
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
        yearInput.value = currentYear;
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

// Обновление отображения выбранных дат
function updateDateDisplay() {
    const selectedRange = document.getElementById('selected-range');
    if (!selectedRange) return;
    
    if (selectedStartDate && selectedEndDate) {
        const start = formatDate(selectedStartDate);
        const end = formatDate(selectedEndDate);
        selectedRange.innerHTML = `<strong>Выбран период: ${start} → ${end}</strong>`;
    } else if (selectedStartDate) {
        selectedRange.innerHTML = `<strong>Выбрана дата: ${formatDate(selectedStartDate)}</strong>`;
    } else {
        selectedRange.innerHTML = '<small>Выберите даты в календаре</small>';
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
    // Интервалы свечей
    document.querySelectorAll('.interval-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем active у всех кнопок
            document.querySelectorAll('.interval-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Добавляем active к нажатой
            this.classList.add('active');
            selectedInterval = this.dataset.interval;
            
            // Обновляем отображение
            document.getElementById('interval-display').textContent = selectedInterval;
        });
    });
    
    // Поле года
    const yearInput = document.getElementById('year-display');
    if (yearInput) {
        yearInput.addEventListener('blur', changeYear);
        yearInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                changeYear();
            }
        });
    }
}

// Обновление статистики
function updateStats() {
    const modelCount = document.getElementById('model-count');
    const historyCount = document.getElementById('history-count');
    const intervalDisplay = document.getElementById('interval-display');
    const periodDisplay = document.getElementById('period-display');
    
    if (modelCount) modelCount.textContent = '0';
    if (historyCount) historyCount.textContent = '0';
    if (intervalDisplay) intervalDisplay.textContent = selectedInterval;
    if (periodDisplay) periodDisplay.textContent = '-';
}

// Запуск анализа
function runAnalysis() {
    if (!selectedStartDate || !selectedEndDate) {
        alert('Пожалуйста, выберите начальную и конечную даты в календаре');
        return;
    }
    
    const analyzeBtn = document.querySelector('.analyze-btn');
    if (!analyzeBtn) return;
    
    const originalText = analyzeBtn.innerHTML;
    
    // Меняем текст кнопки
    analyzeBtn.innerHTML = '<span class="icon">⏳</span><span>Анализ...</span>';
    analyzeBtn.disabled = true;
    
    // Имитация анализа (2 секунды)
    setTimeout(() => {
        // Обновляем статистику
        const modelCount = document.getElementById('model-count');
        const historyCount = document.getElementById('history-count');
        const periodDisplay = document.getElementById('period-display');
        
        if (modelCount) modelCount.textContent = Math.floor(Math.random() * 50) + 20;
        if (historyCount) historyCount.textContent = Math.floor(Math.random() * 30) + 15;
        if (periodDisplay) {
            periodDisplay.textContent = `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`;
        }
        
        // Создаем график
        createAnalysisChart();
        
        // Показываем уведомление
        showNotification('✅ Анализ завершен успешно!', 'success');
        
        // Восстанавливаем кнопку
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
    }, 2000);
}

// Создание графика анализа
function createAnalysisChart() {
    const canvas = document.getElementById('analysis-chart');
    if (!canvas) return;
    
    // Удаляем инструкцию
    const instruction = document.querySelector('.chart-instruction');
    if (instruction) {
        instruction.remove();
    }
    
    // Удаляем старый график
    if (analysisChart) {
        analysisChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    // Создаем данные для графика (демо)
    const data = [];
    const basePrice = 100;
    
    // 30 дней данных
    for (let i = 0; i < 30; i++) {
        const date = new Date(2024, 0, i + 1);
        const open = basePrice + Math.random() * 20;
        const close = open + (Math.random() - 0.5) * 15;
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;
        
        data.push({
            x: date,
            o: parseFloat(open.toFixed(2)),
            h: parseFloat(high.toFixed(2)),
            l: parseFloat(low.toFixed(2)),
            c: parseFloat(close.toFixed(2))
        });
    }
    
    // Создаем свечной график
    analysisChart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'NVIDIA Stock',
                data: data,
                color: {
                    up: '#71BC78',
                    down: '#dc3545',
                    unchanged: '#6c757d'
                },
                borderColor: '#71BC78',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Calibri, sans-serif'
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
                            day: 'dd.MM'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Calibri, sans-serif'
                        }
                    }
                },
                y: {
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        },
                        font: {
                            family: 'Calibri, sans-serif'
                        }
                    }
                }
            }
        }
    });
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#71BC78' : '#dc3545'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-family: Calibri, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем стили для анимаций
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

// Инициализация завершена
console.log('✅ Интерфейс NVIDIA Trading Assistant готов к работе');