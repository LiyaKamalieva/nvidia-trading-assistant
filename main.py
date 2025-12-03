# main.py (ИНТЕГРИРОВАННАЯ ВЕРСИЯ)
from fastapi import FastAPI, Request, Query
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, List
import time
import asyncio
import json
from pydantic import BaseModel

app = FastAPI(title="NVIDIA Trading Assistant")

# CORS для локальной разработки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем файлы сайта (существующее)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ==================== НОВЫЕ МОДЕЛИ ДЛЯ ЗАПРОСОВ ====================
class AnalysisRequest(BaseModel):
    start_date: str
    end_date: str
    start_time: Optional[str] = "09:30"
    end_time: Optional[str] = "16:00"
    interval: str  # '15min', '30min', '1h', '90min', '3h', '5h', '1d'
    use_auto_time: bool = True

# ==================== ЗАГРУЗКА ДАННЫХ (СУЩЕСТВУЮЩЕЕ) ====================
print("⏳ Начинаю загрузку CSV...")
start_time = time.time()

df = None
last_candle_cache = None
candles_cache = {}

try:
    # СУЩЕСТВУЮЩИЙ КОД загрузки CSV
    df = pd.read_csv(
        "NVDA_CLEAN_15M.csv",
        usecols=['datetime', 'Open', 'High', 'Low', 'Close', 'Volume'],
        dtype={
            'Open': 'float32',
            'High': 'float32',
            'Low': 'float32',
            'Close': 'float32',
            'Volume': 'int32'
        }
    )
    
    df['datetime'] = pd.to_datetime(df['datetime'], errors='coerce', infer_datetime_format=True)
    df = df.sort_values('datetime').reset_index(drop=True)
    
    # Дополнительные колонки для новой функциональности
    df['date'] = df['datetime'].dt.date
    df['time'] = df['datetime'].dt.time
    
    # Кэшируем последнюю свечу (существующее)
    if not df.empty:
        last_row = df.iloc[-1]
        last_candle_cache = {
            "datetime": str(last_row['datetime']),
            "Open": float(last_row['Open']),
            "High": float(last_row['High']),
            "Low": float(last_row['Low']),
            "Close": float(last_row['Close']),
            "Volume": int(last_row['Volume'])
        }
    
    elapsed = time.time() - start_time
    print(f"✅ CSV файл загружен: {len(df):,} строк за {elapsed:.2f} сек")
    
except Exception as e:
    print(f"❌ Ошибка загрузки CSV: {e}")
    df = pd.DataFrame()
    last_candle_cache = {
        "datetime": "2020-04-01 15:45:00",
        "Open": 243.01, "High": 243.02, "Low": 243.02, 
        "Close": 243.02, "Volume": 536852
    }

# ==================== НОВЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
def parse_datetime_with_time(date_str: str, time_str: str = "09:30") -> datetime:
    """Парсинг даты с временем"""
    try:
        return pd.to_datetime(f"{date_str} {time_str}")
    except:
        return pd.to_datetime(date_str)

def resample_data_for_interval(dataframe: pd.DataFrame, interval: str) -> pd.DataFrame:
    """Ресемплинг данных по выбранному интервалу"""
    if interval == '15min':
        return dataframe.copy()
    
    freq_map = {
        '30min': '30min',
        '1h': '1h',
        '90min': '90min',
        '3h': '3h',
        '5h': '5h',
        '1d': '1D'
    }
    
    freq = freq_map.get(interval, '15min')
    
    resampled = dataframe.resample(freq, on='datetime').agg({
        'Open': 'first',
        'High': 'max',
        'Low': 'min',
        'Close': 'last',
        'Volume': 'sum'
    }).dropna().reset_index()
    
    return resampled

def generate_model_prediction(historical_data: pd.DataFrame) -> pd.DataFrame:
    """Генерация данных для модели (заглушка до получения реальной модели)"""
    if historical_data.empty:
        return pd.DataFrame()
    
    model_data = historical_data.copy()
    
    # Имитация предсказания модели
    np.random.seed(42)
    noise = np.random.normal(0, 0.02, len(model_data))
    
    # Создаем "предсказанные" значения
    model_data['Close'] = model_data['Close'] * (1 + noise)
    model_data['Open'] = model_data['Close'].shift(1).fillna(model_data['Open'])
    model_data['High'] = model_data[['Open', 'Close']].max(axis=1) * (1 + abs(noise) * 0.3)
    model_data['Low'] = model_data[['Open', 'Close']].min(axis=1) * (1 - abs(noise) * 0.3)
    
    return model_data

def find_similar_pattern_in_history(model_data: pd.DataFrame, historical_df: pd.DataFrame) -> pd.DataFrame:
    """Поиск похожего паттерна в исторических данных"""
    if len(model_data) < 3 or len(historical_df) < len(model_data):
        return pd.DataFrame()
    
    pattern_length = min(len(model_data), 20)
    model_pattern = model_data.tail(pattern_length).copy()
    
    # Ищем похожий паттерн по динамике изменений
    model_returns = np.diff(model_pattern['Close'].values) / model_pattern['Close'].values[:-1]
    
    best_match_idx = 0
    best_match_score = float('inf')
    
    # Поиск по всему историческому набору данных
    for i in range(len(historical_df) - pattern_length):
        window = historical_df.iloc[i:i+pattern_length]
        window_returns = np.diff(window['Close'].values) / window['Close'].values[:-1]
        
        if len(window_returns) == len(model_returns):
            score = np.sqrt(np.mean((model_returns - window_returns) ** 2))
            
            if score < best_match_score:
                best_match_score = score
                best_match_idx = i
    
    return historical_df.iloc[best_match_idx:best_match_idx+pattern_length].copy()

# ==================== НОВЫЕ API ENDPOINTS ====================
@app.post("/api/analyze")
async def analyze_market_data(request: AnalysisRequest):
    """Основной endpoint для анализа с календаря"""
    try:
        # 1. Парсим даты и времена
        if request.use_auto_time:
            start_dt = parse_datetime_with_time(request.start_date, "09:30")
            end_dt = parse_datetime_with_time(request.end_date, "16:00")
        else:
            start_dt = parse_datetime_with_time(request.start_date, request.start_time)
            end_dt = parse_datetime_with_time(request.end_date, request.end_time)
        
        # 2. Фильтруем данные по выбранному периоду
        mask = (df['datetime'] >= start_dt) & (df['datetime'] <= end_dt)
        period_data = df[mask].copy()
        
        if period_data.empty:
            return {
                "success": False,
                "error": "Нет данных за выбранный период",
                "period": f"{request.start_date} - {request.end_date}"
            }
        
        # 3. Ресемплинг по выбранному интервалу
        resampled_data = resample_data_for_interval(period_data, request.interval)
        
        # 4. Генерируем данные модели (заглушка - будет заменено на реальную модель)
        model_data = generate_model_prediction(resampled_data)
        
        # 5. Ищем похожий исторический паттерн
        historical_pattern = find_similar_pattern_in_history(model_data, df)
        
        # 6. Подготавливаем данные для ответа
        model_candles = []
        for _, row in model_data.iterrows():
            model_candles.append({
                "time": row['datetime'].isoformat(),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": int(row.get('Volume', 0))
            })
        
        historical_candles = []
        for _, row in historical_pattern.iterrows():
            historical_candles.append({
                "time": row['datetime'].isoformat(),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": int(row['Volume'])
            })
        
        # 7. Возвращаем результат
        return {
            "success": True,
            "model_candles": model_candles,
            "historical_candles": historical_candles,
            "model_count": len(model_candles),
            "historical_count": len(historical_candles),
            "interval": request.interval,
            "period": {
                "start": request.start_date,
                "end": request.end_date,
                "start_time": request.start_time if not request.use_auto_time else "09:30",
                "end_time": request.end_time if not request.use_auto_time else "16:00",
                "auto_time": request.use_auto_time
            },
            "stats": {
                "model_price_range": {
                    "min": float(model_data['Low'].min()),
                    "max": float(model_data['High'].max()),
                    "avg": float(model_data['Close'].mean())
                },
                "historical_price_range": {
                    "min": float(historical_pattern['Low'].min()) if not historical_pattern.empty else 0,
                    "max": float(historical_pattern['High'].max()) if not historical_pattern.empty else 0,
                    "avg": float(historical_pattern['Close'].mean()) if not historical_pattern.empty else 0
                }
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Ошибка анализа: {str(e)}"
        }

@app.get("/api/available-dates")
async def get_available_dates():
    """Возвращает диапазон доступных дат"""
    if df.empty:
        return {"error": "Нет данных"}
    
    return {
        "min_date": df['datetime'].min().strftime("%Y-%m-%d"),
        "max_date": df['datetime'].max().strftime("%Y-%m-%d"),
        "total_days": (df['datetime'].max() - df['datetime'].min()).days + 1
    }

@app.get("/api/calendar/{year}/{month}")
async def get_calendar_month(year: int, month: int):
    """Возвращает календарь на конкретный месяц с данными о наличии свечей"""
    try:
        # Фильтруем данные по месяцу
        mask = (df['datetime'].dt.year == year) & (df['datetime'].dt.month == month)
        month_data = df[mask].copy()
        
        # Создаем календарь
        import calendar
        cal = calendar.monthcalendar(year, month)
        
        # Подготавливаем результат
        weeks = []
        for week in cal:
            week_data = []
            for day in week:
                if day == 0:
                    week_data.append(None)
                else:
                    # Проверяем, есть ли данные за этот день
                    day_has_data = not month_data[month_data['datetime'].dt.day == day].empty
                    week_data.append({
                        "day": day,
                        "has_data": day_has_data,
                        "date": f"{year}-{month:02d}-{day:02d}"
                    })
            weeks.append(week_data)
        
        return {
            "year": year,
            "month": month,
            "month_name": calendar.month_name[month],
            "weeks": weeks,
            "days_with_data": len(month_data['date'].unique())
        }
        
    except Exception as e:
        return {"error": f"Ошибка генерации календаря: {str(e)}"}

# ==================== СУЩЕСТВУЮЩИЕ ENDPOINTS (БЕЗ ИЗМЕНЕНИЙ) ====================

@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/predict")
async def get_prediction():
    if df is None or df.empty:
        return {
            "action": "HOLD",
            "confidence": 0.5,
            "price": 0,
            "message": "CSV файл не загружен"
        }
    
    return {
        "action": "BUY",
        "confidence": 0.85,
        "price": last_candle_cache["Close"],
        "current_candle": last_candle_cache,
        "message": "Заглушка - модель в разработке"
    }

@app.get("/api/last-candle")
async def get_last_candle():
    if df is None or df.empty:
        return {"error": "CSV файл не загружен"}
    
    return last_candle_cache

@app.get("/api/candles")
async def get_candles(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(50)
):
    if df is None or df.empty:
        return {"error": "CSV файл не загружен"}
    
    cache_key = f"{start_date}_{end_date}_{limit}"
    
    if cache_key in candles_cache:
        return candles_cache[cache_key]
    
    filtered_df = df
    
    if start_date:
        try:
            start_dt = pd.to_datetime(start_date)
            mask = filtered_df['datetime'] >= start_dt
            filtered_df = filtered_df[mask]
        except:
            return {"error": "Неверный формат start_date"}
    
    if end_date:
        try:
            end_dt = pd.to_datetime(end_date)
            mask = filtered_df['datetime'] <= end_dt
            filtered_df = filtered_df[mask]
        except:
            return {"error": "Неверный формат end_date"}
    
    limit = min(limit, 200)
    if len(filtered_df) > limit:
        filtered_df = filtered_df.tail(limit)
    
    candles = filtered_df.to_dict('records')
    
    for candle in candles:
        candle['datetime'] = str(candle['datetime'])
        candle['Open'] = float(candle['Open'])
        candle['High'] = float(candle['High'])
        candle['Low'] = float(candle['Low'])
        candle['Close'] = float(candle['Close'])
        candle['Volume'] = int(candle['Volume'])
    
    result = {
        "count": len(candles),
        "candles": candles
    }
    
    candles_cache[cache_key] = result
    
    return result

@app.get("/api/stats")
async def get_stats():
    if df is None or df.empty:
        return {"error": "CSV файл не загружен"}
    
    close_prices = df['Close'].values
    
    return {
        "total_rows": len(df),
        "date_range": {
            "start": str(df['datetime'].iloc[0]),
            "end": str(df['datetime'].iloc[-1])
        },
        "price_stats": {
            "avg_close": float(close_prices.mean()),
            "max_close": float(close_prices.max()),
            "min_close": float(close_prices.min()),
            "last_close": float(close_prices[-1])
        }
    }

@app.get("/api/candles/{date_str}")
async def get_candles_by_date(date_str: str):
    if df is None or df.empty:
        return {"error": "CSV файл не загружен"}
    
    if date_str in candles_cache:
        return candles_cache[date_str]
    
    try:
        target_date = pd.to_datetime(date_str).date()
        mask = df['datetime'].dt.date == target_date
        day_candles = df[mask]
        
        candles = []
        for _, row in day_candles.iterrows():
            candles.append({
                "time": row['datetime'].strftime("%H:%M"),
                "Open": float(row['Open']),
                "High": float(row['High']),
                "Low": float(row['Low']),
                "Close": float(row['Close']),
                "Volume": int(row['Volume'])
            })
        
        result = {
            "date": date_str,
            "count": len(candles),
            "candles": candles
        }
        
        candles_cache[date_str] = result
        
        return result
        
    except Exception as e:
        return {"error": f"Ошибка: {str(e)}"}

@app.get("/api/status")
async def get_status():
    return {
        "status": "running",
        "csv_loaded": df is not None and not df.empty,
        "csv_rows": len(df) if df is not None else 0,
        "optimized": True,
        "cache_size": len(candles_cache),
        "api_endpoints": [
            "/api/predict",
            "/api/last-candle", 
            "/api/candles",
            "/api/stats",
            "/api/candles/{date}",
            "/api/status",
            "/api/analyze",  # Новый endpoint
            "/api/available-dates",  # Новый endpoint
            "/api/calendar/{year}/{month}"  # Новый endpoint
        ]
    }

@app.get("/simple")
async def simple_page(request: Request):
    return templates.TemplateResponse("simple.html", {"request": request})

@app.get("/api/clear-cache")
async def clear_cache():
    candles_cache.clear()
    return {"message": "Кэш очищен", "cache_size": 0}

# ==================== ЗАПУСК ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8001,
        log_level="info",
        access_log=False
    )