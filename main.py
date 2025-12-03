# main.py
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import os

app = FastAPI(title="NVIDIA Trading Assistant")

# Создаем папки если их нет
os.makedirs("static", exist_ok=True)
os.makedirs("templates", exist_ok=True)

# Подключаем статические файлы
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Минимальная HTML страница
simple_html = """
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NVIDIA Trading Assistant</title>
    <style>
        /* ВСЕ СТИЛИ ПРЯМО ЗДЕСЬ */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            padding: 40px;
        }
        
        .header h1 {
            font-size: 3.5rem;
            background: linear-gradient(135deg, #76b900 0%, #00b4d8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        
        .container {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 30px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .card {
            background: white;
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 1px solid #e2e8f0;
            margin-bottom: 20px;
        }
        
        .calendar {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 8px;
            margin: 20px 0;
        }
        
        .day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            background: white;
            border: 2px solid #e2e8f0;
            cursor: pointer;
        }
        
        .day:hover {
            background: #76b900;
            color: white;
            border-color: #76b900;
        }
        
        button {
            padding: 15px;
            background: #76b900;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
        }
        
        button:hover {
            background: #5a8f00;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>NVIDIA Trading Assistant</h1>
        <p>Анализ рыночных данных NVIDIA с использованием ИИ-моделей</p>
    </div>
    
    <div class="container">
        <!-- График -->
        <div>
            <div class="card">
                <h2>📈 График анализа</h2>
                <div style="height: 500px; background: #f8fafc; border-radius: 15px; display: flex; align-items: center; justify-content: center;">
                    График будет здесь
                </div>
            </div>
        </div>
        
        <!-- Управление -->
        <div>
            <!-- Календарь -->
            <div class="card">
                <h3>📅 Выбор периода</h3>
                <div style="text-align: center; font-size: 1.3rem; margin-bottom: 15px;">
                    <strong>January 2024</strong>
                </div>
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 10px;">
                    <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
                </div>
                <div class="calendar">
                    <div class="day">1</div><div class="day">2</div><div class="day">3</div>
                    <div class="day">4</div><div class="day">5</div><div class="day">6</div>
                    <div class="day">7</div><div class="day">8</div><div class="day">9</div>
                    <div class="day">10</div><div class="day">11</div><div class="day">12</div>
                    <div class="day">13</div><div class="day">14</div><div class="day">15</div>
                    <div class="day">16</div><div class="day">17</div><div class="day">18</div>
                    <div class="day">19</div><div class="day">20</div><div class="day">21</div>
                    <div class="day">22</div><div class="day">23</div><div class="day">24</div>
                    <div class="day">25</div><div class="day">26</div><div class="day">27</div>
                    <div class="day">28</div><div class="day">29</div><div class="day">30</div>
                    <div class="day">31</div>
                </div>
            </div>
            
            <!-- Интервалы -->
            <div class="card">
                <h3>⚙️ Интервал свечей</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <button style="background: #76b900; color: white;">15 мин</button>
                    <button style="background: #fff; color: #333; border: 2px solid #e2e8f0;">30 мин</button>
                    <button style="background: #fff; color: #333; border: 2px solid #e2e8f0;">1 час</button>
                    <button style="background: #fff; color: #333; border: 2px solid #e2e8f0;">1.5 часа</button>
                    <button style="background: #fff; color: #333; border: 2px solid #e2e8f0;">3 часа</button>
                    <button style="background: #fff; color: #333; border: 2px solid #e2e8f0;">1 день</button>
                </div>
            </div>
            
            <!-- Кнопка анализа -->
            <div class="card">
                <button style="background: linear-gradient(135deg, #76b900, #5a8f00); font-size: 1.2rem; padding: 20px;">
                    🚀 Запустить анализ
                </button>
            </div>
        </div>
    </div>
    
    <script>
        console.log("Сайт загружен!");
    </script>
</body>
</html>
"""

@app.get("/")
async def home():
    return HTMLResponse(content=simple_html)

if __name__ == "__main__":
    import uvicorn
    print("🚀 Сервер запускается...")
    print("📊 Откройте в браузере: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)