
let analysisChart = null;
let selectedStartDate = null;
let selectedEndDate = null;
let currentMonth = new Date().getMonth();
let currentYear = 1999; 
let selectedInterval = '15min';


document.addEventListener('DOMContentLoaded', async function() { //доб. событие, когда html загружен
    loadAvailableDates();
    setupEventListeners();
    

    document.getElementById('year-display').value = currentYear;  //год по умолчанию
    
    loadCalendar();
});


async function loadAvailableDates() { // загрузка доступных дат
    try {
        const response = await fetch('/api/available-dates'); //будет брать данные из модели и базы данных
        const data = await response.json();
        
        if (data.error) {
            console.error('Ошибка загрузки дат:', data.error);
            return;
        }
        
        
        const minDate = new Date(data.min_date);
        currentYear = minDate.getFullYear(); // берем минимальную дату из базы
        currentMonth = minDate.getMonth();
        
    } catch (error) {
        console.error('Ошибка загрузки дат:', error);
    }
}

async function loadCalendar() {
    try {
        const response = await fetch(`/api/calendar/${currentYear}/${currentMonth + 1}`);
        const data = await response.json();
        
        if (data.error) {
            console.error('Ошибка загрузки календаря:', data.error);
            return;
        }
        
        
        document.getElementById('calendar-header').textContent = data.month_name; //месяц берется текущий
        
        
        document.getElementById('year-display').value = currentYear; // обновляем год
        
        
        const calendarGrid = document.getElementById('calendar-grid'); // генерируем календарь
        calendarGrid.innerHTML = '';
        
        data.weeks.forEach(week => {
            week.forEach(day => {
                const dayElement = document.createElement('div'); //квадрат для даты каждой
                
                if (day === null) {
                    dayElement.className = 'calendar-day empty';
                    dayElement.innerHTML = '';
                } else {
                    dayElement.className = 'calendar-day';
                    dayElement.textContent = day.day;
                    dayElement.dataset.date = day.date; //полная дата атрибут
                    
                    
                    if (selectedStartDate && day.date === selectedStartDate) { //selectedStartDate дата которую выбрал пользователь
                        dayElement.classList.add('selected');
                    } else if (selectedEndDate && day.date === selectedEndDate) {
                        dayElement.classList.add('selected');
                    } else if (isDateInRange(day.date)) {
                        dayElement.classList.add('range');
                    }
                    
                    dayElement.addEventListener('click', () => selectDate(day.date));
                }
                
                calendarGrid.appendChild(dayElement); //добавляет созданный день в календарь
            });
        });
        
        updateDateDisplay(); //обновление выбранных дат
        
    } catch (error) {
        console.error('Ошибка загрузки календаря:', error);
    }
}


function changeMonth(delta) { //дельта +-1
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


function changeYear() { 
    const yearInput = document.getElementById('year-display');
    const newYear = parseInt(yearInput.value); //ввел пользователь
    
    if (!isNaN(newYear) && newYear >= 1999 && newYear <= 2100) {
        currentYear = newYear;
        loadCalendar();
    } else {
        yearInput.value = currentYear; // возвращаем предыдущее значение
    }
}


function selectDate(date) { //выбор даты
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


function isDateInRange(date) { //проверка даты в диапазоне
    if (!selectedStartDate || !selectedEndDate) return false;
    
    const checkDate = new Date(date);
    const startDate = new Date(selectedStartDate);
    const endDate = new Date(selectedEndDate);
    
    return checkDate >= startDate && checkDate <= endDate;
}


function updateDateDisplay() { //обновление отображения дат
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


function formatDate(dateString) { //форматирование даты
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit', //день двухзначный
        month: '2-digit',
        year: 'numeric'
    });
}


function setupEventListeners() { //настройка обработчиков событий
    const autoTimeToggle = document.getElementById('auto-time'); //время внутри дня
    const timeInputs = document.getElementById('time-inputs');
    
    autoTimeToggle.addEventListener('change', function() {
        timeInputs.style.display = this.checked ? 'none' : 'grid'; //или скрывает или появляются плашки со временем
    });

    document.querySelectorAll('.interval-btn').forEach(btn => { //интервалы свечей
        btn.addEventListener('click', function() {
            document.querySelectorAll('.interval-btn').forEach(b => b.classList.remove('active')); 
            this.classList.add('active'); //перемещение активной(выделенной кнопки)
            selectedInterval = this.dataset.interval;
            document.getElementById('interval-display').textContent = selectedInterval;
        });
    });
    
    const yearInput = document.getElementById('year-display');  //поле года
    yearInput.addEventListener('blur', changeYear); //срабатывает, когда поле теряет фокус
    yearInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            changeYear();
        }
    });
}


async function runAnalysis() {
    if (!selectedStartDate || !selectedEndDate) {
        alert('Пожалуйста, выберите начальную и конечную даты');
        return;
    }
    
    const analyzeBtn = document.querySelector('.analyze-btn'); //нажимает кнопку анализировать
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '<span class="icon"></span><span>Анализ...</span>';
    analyzeBtn.disabled = true; //чтобы нельзя было нажать дважды
    
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
            method: 'POST', //передает данные
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Ошибка анализа');
        }
        
        //обновляем статистику
        document.getElementById('model-count').textContent = data.model_count; //кол-во свечей модели
        document.getElementById('history-count').textContent = data.historical_count; //кол-во свечей из базы
        document.getElementById('interval-display').textContent = selectedInterval;
        document.getElementById('period-display').textContent = 
            `${formatDate(data.period.start)} - ${formatDate(data.period.end)}`;
        
        //график
        createAnalysisChart(data.model_candles, data.historical_candles);
        
        //показ уведомления
        showNotification('Анализ завершен успешно!', 'success');
        
    } catch (error) {
        console.error('Ошибка анализа:', error); //мне
        showNotification(`Ошибка: ${error.message}`, 'error'); //пользователю
    } finally {
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false; //разблокирет кн. для нов. анализа
    }
}

//создание графика анализа
function createAnalysisChart(modelCandles, historicalCandles) {
    const ctx = document.getElementById('analysis-chart').getContext('2d');
    
    
    if (analysisChart) {
        analysisChart.destroy(); //удаление старого графика
    }
    
    const modelData = modelCandles.map(candle => ({ //предв. данные
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
                        up: '#71BC78',  
                        down: '#dc3545', 
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
            responsive: true, //подстраивается под размер экрана
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
                        padding: 10, //отступ
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
                            const datasetLabel = context.dataset.label || ''; //берем данные либо из модели, либо из базы данных
                            const point = context.raw;
                            return [
                                `${datasetLabel}`,
                                `Open: $${point.o.toFixed(2)}`, //до двух знаков после запятой
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
                        color: 'rgba(0, 0, 0, 0.05)' //линии сетки
                    },
                    ticks: {
                        color: '#6c757d', //цвет подписей
                        font: {
                            family: 'Calibri, sans-serif'
                        }
                    }
                },
                y: {
                    position: 'left',
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
                duration: 500 //появляется график за 0,5 сек
            }
        }
    });
}


function showNotification(message, type = 'info') { //уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`; //type - success/error
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
    
    document.body.appendChild(notification); //добавляем на страницу
    
    setTimeout(() => { //удаление через 3 сек
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000); //0,3 сек ждем потом оно удаляется из html
}


function getActionText(action) {
    switch(action) {
        case 'BUY': return 'Заметен рост';
        case 'SELL': return 'Заметно снижение';
        case 'HOLD': return 'Ни покупать, ни продавать';
        default: return 'Что-то пошло не так';
    }
}


const style = document.createElement('style'); //cтили для анимаций css
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
