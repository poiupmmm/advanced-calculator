from flask import Flask, render_template, jsonify
import pandas as pd
import os
import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import json
import traceback

from src.data_fetcher import DataFetcher
from src.strategy import StockStrategy

app = Flask(__name__)

# 创建数据目录
data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
os.makedirs(data_dir, exist_ok=True)

# 全局变量
signal_stocks = pd.DataFrame()
last_update_time = None

def update_stock_data():
    """更新股票数据并运行选股策略"""
    global signal_stocks, last_update_time
    
    try:
        print(f"开始更新股票数据: {datetime.datetime.now()}")
        
        # 初始化数据获取器和策略
        fetcher = DataFetcher()
        strategy = StockStrategy()
        
        # 获取股票列表
        stock_list = fetcher.get_stock_list()
        
        if stock_list.empty:
            print("获取股票列表失败，无法继续更新")
            return
        
        # 检查是否是交易日
        today = datetime.datetime.now().strftime('%Y-%m-%d')
        is_trading_day = True  # 默认为交易日
        
        # 如果是周末，则不是交易日
        weekday = datetime.datetime.now().weekday()
        if weekday >= 5:  # 5是周六，6是周日
            is_trading_day = False
            print(f"今天是周末，不是交易日")
        
        # 如果不是交易日，则不更新数据
        if not is_trading_day:
            return
        
        # 获取所有股票数据
        # 为了获取更多股票，这里获取前1000只股票的数据
        test_stock_list = stock_list.head(1000)
        print(f"将获取 {len(test_stock_list)} 只股票的数据")
        all_stocks_data = fetcher.get_all_stocks_data(test_stock_list)
        
        if not all_stocks_data:
            print("没有获取到股票数据，无法继续更新")
            return
        
        # 保存数据
        fetcher.save_data(all_stocks_data, f'stocks_data_{today}.pkl')
        
        # 运行选股策略
        signal_stocks = strategy.scan_stocks(all_stocks_data)
        
        if signal_stocks.empty:
            print("没有找到符合条件的股票")
        else:
            # 保存选股结果
            signal_stocks.to_csv(os.path.join(data_dir, f'signal_stocks_{today}.csv'), index=False, encoding='utf-8-sig')
            
            # 更新最后更新时间
            last_update_time = datetime.datetime.now()
            
            print(f"股票数据更新完成: {last_update_time}")
            print(f"今日选股结果: {len(signal_stocks)} 只股票")
        
    except Exception as e:
        print(f"更新股票数据时出错: {e}")
        print(traceback.format_exc())

# 初始化定时任务
scheduler = BackgroundScheduler()
# 每个交易日下午15:30运行一次（收盘后）
scheduler.add_job(update_stock_data, 'cron', hour=15, minute=30, day_of_week='0-4')
# 每天早上9:30运行一次（开盘前）
scheduler.add_job(update_stock_data, 'cron', hour=9, minute=30, day_of_week='0-4')

@app.route('/')
def index():
    """首页"""
    return render_template('index.html')

@app.route('/api/signals')
def get_signals():
    """获取选股信号"""
    global signal_stocks, last_update_time
    
    try:
        # 如果没有数据，尝试从文件加载
        if signal_stocks.empty:
            try:
                # 获取最新的信号文件
                files = [f for f in os.listdir(data_dir) if f.startswith('signal_stocks_') and f.endswith('.csv')]
                if files:
                    latest_file = max(files)
                    signal_stocks = pd.read_csv(os.path.join(data_dir, latest_file), encoding='utf-8-sig')
                    last_update_time = datetime.datetime.strptime(latest_file.split('_')[-1].split('.')[0], '%Y-%m-%d')
            except Exception as e:
                print(f"加载信号数据时出错: {e}")
                print(traceback.format_exc())
        
        # 转换为JSON格式
        result = {
            'last_update': last_update_time.strftime('%Y-%m-%d %H:%M:%S') if last_update_time else None,
            'count': len(signal_stocks),
            'signals': json.loads(signal_stocks.to_json(orient='records', force_ascii=False)) if not signal_stocks.empty else []
        }
        
        return jsonify(result)
    except Exception as e:
        print(f"获取信号数据时出错: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)})

@app.route('/api/update', methods=['POST'])
def trigger_update():
    """手动触发更新"""
    try:
        update_stock_data()
        return jsonify({'status': 'success', 'message': '更新已触发'})
    except Exception as e:
        print(f"触发更新时出错: {e}")
        print(traceback.format_exc())
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    # 启动定时任务
    scheduler.start()
    
    # 启动Flask应用
    app.run(debug=True, host='0.0.0.0', port=5000) 