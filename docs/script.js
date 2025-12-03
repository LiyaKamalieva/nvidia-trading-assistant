// docs/script.js - Статическая версия для GitHub Pages
let analysisChart = null;
let selectedStartDate = null;
let selectedEndDate = null;
let currentMonth = new Date().getMonth();
let currentYear = 2005;
let selectedInterval = '15min';

// Демо-функции для статической версии
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    document.getElementById('year-display').value = currentYear;
    loadDemoCalendar();
    createDemoChart();
});

function loadDemoCalendar() {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    document.getElementById('calendar-header').textContent = months[currentMonth];
    document.getElementById('year-display').value = currentYear;
    
    // Простой демо-календарь
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    
    // Дни в месяце (упрощенно)
    const daysInMonth = 31;
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = i;
        dayElement.dataset.date = ${currentYear}--;
        
        // Проверяем, выбрана ли дата
        if (selectedStartDate && dayElement.dataset.date === selectedStartDate) {
            dayElement.classList.add('selected');
        } else if (selectedEndDate && dayElement.dataset.date === selectedEndDate) {
            dayElement.classList.add('selected');
        }
        
        dayElement.addEventListener('click', function() {
            selectDate(this.dataset.date);
        });
        
        calendarGrid.appendChild(dayElement);
    }
    
    updateDateDisplay();
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    loadDemoCalendar();
}

function changeYear() {
    const yearInput = document.getElementById('year-display');
    const newYear = parseInt(yearInput.value);
    if (!isNaN(newYear) && newYear >= 2000 && newYear <= 2100) {
        currentYear = newYear;
        loadDemoCalendar();
    } else {
        yearInput.value = currentYear;
    }
}

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
    loadDemoCalendar();
    updateDateDisplay();
}

function updateDateDisplay() {
    const selectedRange = document.getElementById('selected-range');
    if (selectedStartDate && selectedEndDate) {
        const start = formatDate(selectedStartDate);
        const end = formatDate(selectedEndDate);
        selectedRange.innerHTML = <strong>Выбран период:  → </strong>;
        
        // Обновляем статистику
        document.getElementById('model-count').textContent = Math.floor(Math.random() * 50) + 20;
        document.getElementById('history-count').textContent = Math.floor(Math.random() * 30) + 15;
        document.getElementById('period-display').textContent = ${start} - ;
    } else if (selectedStartDate) {
        selectedRange.innerHTML = <strong>Выбрана дата: </strong>;
    } else {
        selectedRange.innerHTML = '<small>Выберите даты в календаре</small>';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function setupEventListeners() {
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
        if (e.key === 'Enter') changeYear();
    });
    
    // Автоматическое время
    const autoTimeToggle = document.getElementById('auto-time');
    const timeInputs = document.getElementById('time-inputs');
    
    if (autoTimeToggle && timeInputs) {
        autoTimeToggle.addEventListener('change', function() {
            timeInputs.style.display = this.checked ? 'none' : 'grid';
        });
    }
}

function runAnalysis() {
    if (!selectedStartDate || !selectedEndDate) {
        alert('Пожалуйста, выберите начальную и конечную даты');
        return;
    }
    
    const btn = document.querySelector('.analyze-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳ Анализ...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        document.getElementById('model-count').textContent = Math.floor(Math.random() * 50) + 20;
        document.getElementById('history-count').textContent = Math.floor(Math.random() * 30) + 15;
        document.getElementById('period-display').textContent = 
            ${formatDate(selectedStartDate)} - ;
        
        updateChart();
        
        // Простое уведомление
        const notification = document.createElement('div');
        notification.textContent = 'Анализ завершен успешно! (Демо-версия)';
        notification.style.cssText = 
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 16px;
            background: #71BC78;
            color: white;
            border-radius: 6px;
            z-index: 1000;
        ;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 1500);
}

function createDemoChart() {
    const ctx = document.getElementById('analysis-chart').getContext('2d');
    const data = [];
    
    for (let i = 0; i < 20; i++) {
        const open = 100 + Math.random() * 20;
        const close = open + (Math.random() - 0.5) * 10;
        data.push({
            x: new Date(2024, 0, i + 1),
            o: open,
            h: Math.max(open, close) + Math.random() * 5,
            l: Math.min(open, close) - Math.random() * 5,
            c: close
        });
    }
    
    analysisChart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'Демо-данные',
                data: data,
                color: { up: '#71BC78', down: '#dc3545' },
                borderColor: '#71BC78'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updateChart() {
    if (analysisChart) {
        const newData = analysisChart.data.datasets[0].data.map(d => ({
            ...d,
            o: d.o * (1 + (Math.random() - 0.5) * 0.1),
            c: d.c * (1 + (Math.random() - 0.5) * 0.1),
            h: d.h * (1 + (Math.random() - 0.5) * 0.05),
            l: d.l * (1 + (Math.random() - 0.5) * 0.05)
        }));
        analysisChart.data.datasets[0].data = newData;
        analysisChart.update();
    }
}
