// Простой скрипт для начала
console.log('NVIDIA Trading Assistant loaded');

function runAnalysis() {
    alert('Анализ запущен! (Демо-версия)');
    
    // Обновим статистику
    document.getElementById('model-count').textContent = 
        Math.floor(Math.random() * 50) + 20;
    document.getElementById('history-count').textContent = 
        Math.floor(Math.random() * 30) + 15;
}

// Создадим простой график
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('analysis-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
            datasets: [{
                label: 'NVIDIA',
                data: [100, 120, 130, 110, 150, 140],
                borderColor: '#71BC78',
                backgroundColor: 'rgba(113, 188, 120, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
});