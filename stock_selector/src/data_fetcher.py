import baostock as bs
import pandas as pd
import numpy as np
import datetime
import time
import os
import traceback
import concurrent.futures

class DataFetcher:
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        os.makedirs(self.data_dir, exist_ok=True)
        # 登录baostock
        try:
            self.bs = bs
            self.login_result = self.bs.login()
            print(f"BaoStock登录状态: {self.login_result.error_code} {self.login_result.error_msg}")
        except Exception as e:
            print(f"BaoStock登录失败: {e}")
            print(traceback.format_exc())
        
    def __del__(self):
        # 登出系统
        try:
            if hasattr(self, 'bs'):
                self.bs.logout()
        except Exception as e:
            print(f"BaoStock登出失败: {e}")
    
    def get_stock_list(self):
        """获取A股股票列表（剔除北交所、ST和科创板）"""
        try:
            # 获取证券基本资料
            rs = self.bs.query_stock_basic()
            if rs.error_code != '0':
                print(f"获取股票列表失败: {rs.error_code} {rs.error_msg}")
                return pd.DataFrame()
                
            # 打印结果集
            data_list = []
            while (rs.error_code == '0') & rs.next():
                data_list.append(rs.get_row_data())
            
            if len(data_list) == 0:
                print("获取股票列表为空")
                return pd.DataFrame()
                
            stock_list = pd.DataFrame(data_list, columns=rs.fields)
            
            # 只保留A股
            stock_list = stock_list[stock_list['type'] == '1']  # 1表示A股
            
            # 重命名列
            stock_list.rename(columns={'code': '代码', 'code_name': '名称'}, inplace=True)
            
            # 剔除北交所（股票代码以4或8开头）
            stock_list = stock_list[~stock_list['代码'].str.startswith(('sh.4', 'sh.8', 'sz.4', 'sz.8'))]
            
            # 剔除ST股票
            stock_list = stock_list[~stock_list['名称'].str.contains('ST')]
            
            # 剔除科创板（股票代码以688开头）
            stock_list = stock_list[~stock_list['代码'].str.contains('sh.688')]
            
            # 只保留需要的列
            stock_list = stock_list[['代码', '名称']]
            
            print(f"获取到 {len(stock_list)} 只股票")
            return stock_list
        except Exception as e:
            print(f"获取股票列表失败: {e}")
            print(traceback.format_exc())
            return pd.DataFrame()
    
    def get_stock_data(self, stock_code, period=90):
        """获取单个股票的历史数据，只获取关键数据"""
        try:
            # 确保获取足够的历史数据用于计算指标
            end_date = datetime.datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.datetime.now() - datetime.timedelta(days=period*1.2)).strftime('%Y-%m-%d')
            
            # 获取历史A股K线数据，只获取关键字段
            rs = self.bs.query_history_k_data_plus(
                stock_code,
                "date,high,low,close",  # 只获取关键字段：日期、最高价、最低价、收盘价
                start_date=start_date,
                end_date=end_date,
                frequency="d",
                adjustflag="2"  # 前复权
            )
            
            if rs.error_code != '0':
                print(f"获取股票 {stock_code} 数据失败: {rs.error_code} {rs.error_msg}")
                return None
            
            # 获取结果集
            data_list = []
            while (rs.error_code == '0') & rs.next():
                data_list.append(rs.get_row_data())
            
            # 如果没有数据，返回None
            if len(data_list) == 0:
                print(f"股票 {stock_code} 没有数据")
                return None
                
            # 转换为DataFrame
            stock_data = pd.DataFrame(data_list, columns=rs.fields)
            
            # 转换数据类型
            try:
                stock_data['high'] = stock_data['high'].astype(float)
                stock_data['low'] = stock_data['low'].astype(float)
                stock_data['close'] = stock_data['close'].astype(float)
            except Exception as e:
                print(f"转换股票 {stock_code} 数据类型失败: {e}")
                print(stock_data.head())
                return None
            
            # 重命名列以便于后续处理
            stock_data.rename(columns={
                'date': '日期',
                'high': 'HIGH',
                'low': 'LOW',
                'close': 'CLOSE'
            }, inplace=True)
            
            # 添加必要的计算字段
            stock_data['OPEN'] = stock_data['CLOSE']  # 使用收盘价代替开盘价，简化计算
            stock_data['成交量'] = 0  # 不需要成交量数据
            stock_data['成交额'] = 0  # 不需要成交额数据
            stock_data['换手率'] = 0  # 不需要换手率数据
            
            # 确保数据按日期排序（从旧到新）
            stock_data = stock_data.sort_values('日期')
            
            # 确保至少有足够的数据
            if len(stock_data) < 60:  # 至少需要60天的数据
                print(f"股票 {stock_code} 数据不足 60 天")
                return None
                
            return stock_data
        except Exception as e:
            print(f"获取股票 {stock_code} 数据失败: {e}")
            print(traceback.format_exc())
            return None
    
    def get_stock_data_batch(self, stock_codes, max_workers=10):
        """批量获取多个股票的数据"""
        results = {}
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # 创建一个股票代码到future的映射
            future_to_stock = {executor.submit(self.get_stock_data, code): code for code in stock_codes}
            
            # 处理完成的future
            for future in concurrent.futures.as_completed(future_to_stock):
                stock_code = future_to_stock[future]
                try:
                    data = future.result()
                    if data is not None:
                        results[stock_code] = data
                except Exception as e:
                    print(f"获取股票 {stock_code} 数据时出错: {e}")
        
        return results
    
    def get_all_stocks_data(self, stock_list=None):
        """获取所有股票的历史数据，使用并行处理加速"""
        if stock_list is None:
            stock_list = self.get_stock_list()
        
        if stock_list.empty:
            print("股票列表为空，无法获取数据")
            return {}
        
        all_data = {}
        total = len(stock_list)
        print(f"开始获取 {total} 只股票的数据...")
        
        # 将股票分成多个批次处理，每批次最多50只股票
        batch_size = 50
        for i in range(0, total, batch_size):
            batch_end = min(i + batch_size, total)
            print(f"处理批次 {i//batch_size + 1}/{(total+batch_size-1)//batch_size}，股票 {i+1}-{batch_end}/{total}")
            
            batch_codes = stock_list['代码'].iloc[i:batch_end].tolist()
            batch_names = stock_list['名称'].iloc[i:batch_end].tolist()
            
            # 批量获取数据
            batch_data = {}
            for j, (code, name) in enumerate(zip(batch_codes, batch_names)):
                print(f"正在获取 [{i+j+1}/{total}] {code} {name} 的数据...")
                data = self.get_stock_data(code)
                if data is not None:
                    all_data[code] = {'name': name, 'data': data}
                
                # 避免请求过于频繁，每10个请求暂停一下
                if (j + 1) % 10 == 0:
                    time.sleep(0.5)
        
        print(f"成功获取了 {len(all_data)} 只股票的数据")
        return all_data
    
    def save_data(self, data, filename):
        """保存数据到文件"""
        try:
            if not data:
                print(f"没有数据可保存到 {filename}")
                return
                
            filepath = os.path.join(self.data_dir, filename)
            pd.to_pickle(data, filepath)
            print(f"数据已保存到 {filepath}")
        except Exception as e:
            print(f"保存数据到 {filename} 失败: {e}")
            print(traceback.format_exc())
    
    def load_data(self, filename):
        """从文件加载数据"""
        try:
            filepath = os.path.join(self.data_dir, filename)
            if os.path.exists(filepath):
                data = pd.read_pickle(filepath)
                print(f"从 {filepath} 加载了数据")
                return data
            else:
                print(f"文件 {filepath} 不存在")
                return None
        except Exception as e:
            print(f"从 {filename} 加载数据失败: {e}")
            print(traceback.format_exc())
            return None 