import pandas as pd
import numpy as np
import traceback

class StockStrategy:
    def __init__(self):
        pass
    
    def calculate_indicators(self, df):
        """计算选股策略中的各项指标，优化计算效率"""
        try:
            # 确保数据足够
            if df is None or len(df) < 60:
                return None
            
            # 复制数据，避免修改原始数据
            data = df.copy()
            
            # 计算各项指标，使用较短的周期
            # 计算高点
            data['HHV_HIGH_90'] = data['HIGH'].rolling(window=min(90, len(data))).max()
            data['HHV_HIGH_150'] = data['HIGH'].rolling(window=min(150, len(data))).max()
            data['HHV_HIGH_200'] = data['HIGH'].rolling(window=min(200, len(data))).max()
            
            # 计算低点
            data['LLV_LOW_90'] = data['LOW'].rolling(window=min(90, len(data))).min()
            data['LLV_LOW_150'] = data['LOW'].rolling(window=min(150, len(data))).min()
            data['LLV_LOW_200'] = data['LOW'].rolling(window=min(200, len(data))).min()
            
            # 使用EMA平滑处理
            data['Var1'] = data['HHV_HIGH_200'].ewm(span=21, adjust=False).mean()
            data['Var2'] = data['HHV_HIGH_150'].ewm(span=21, adjust=False).mean()
            data['Var3'] = data['HHV_HIGH_90'].ewm(span=21, adjust=False).mean()
            data['Var4'] = data['LLV_LOW_200'].ewm(span=21, adjust=False).mean()
            data['Var5'] = data['LLV_LOW_150'].ewm(span=21, adjust=False).mean()
            data['Var6'] = data['LLV_LOW_90'].ewm(span=21, adjust=False).mean()
            
            # 计算价格通道
            data['Var7'] = ((data['Var4']*0.96 + data['Var5']*0.96 + data['Var6']*0.96 + 
                            data['Var1']*0.558 + data['Var2']*0.558 + data['Var3']*0.558) / 6).ewm(span=21, adjust=False).mean()
            
            data['Var8'] = ((data['Var4']*1.25 + data['Var5']*1.23 + data['Var6']*1.2 + 
                            data['Var1']*0.55 + data['Var2']*0.55 + data['Var3']*0.65) / 6).ewm(span=21, adjust=False).mean()
            
            data['Var9'] = ((data['Var4']*1.3 + data['Var5']*1.3 + data['Var6']*1.3 + 
                            data['Var1']*0.68 + data['Var2']*0.68 + data['Var3']*0.68) / 6).ewm(span=21, adjust=False).mean()
            
            # 计算关键价格线
            data['VarA'] = ((data['Var7']*3 + data['Var8']*2 + data['Var9']) / 6 * 1.738).ewm(span=21, adjust=False).mean()
            
            # 计算波动率指标
            data['VarB'] = data['LOW'].shift(1)
            
            # 简化SMA计算
            abs_diff = np.abs(data['LOW'] - data['VarB'])
            max_diff = np.maximum(data['LOW'] - data['VarB'], 0)
            
            # 使用更高效的方式计算SMA
            data['SMA_ABS'] = abs_diff.ewm(alpha=1/3, adjust=False).mean()
            data['SMA_MAX'] = max_diff.ewm(alpha=1/3, adjust=False).mean()
            
            # 处理除零问题
            data['VarC'] = data['SMA_ABS'] / data['SMA_MAX'].replace(0, np.nan) * 100
            data['VarC'] = data['VarC'].fillna(0)
            
            # 计算VarD
            data['VarD'] = np.where(data['CLOSE']*1.35 <= data['VarA'], 
                                    data['VarC']*10, 
                                    data['VarC']/10).ewm(span=3, adjust=False).mean()
            
            # 计算其他指标
            data['VarE'] = data['LOW'].rolling(window=min(30, len(data))).min()
            data['VarF'] = data['VarD'].rolling(window=min(30, len(data))).max()
            
            # 计算均线
            data['MA_CLOSE_58'] = data['CLOSE'].rolling(window=min(58, len(data))).mean()
            data['Var10'] = np.where(data['MA_CLOSE_58'] > 0, 1, 0)
            
            # 计算资金入场信号
            data['资金入场'] = np.where(data['LOW'] <= data['VarE'], 
                                    (data['VarD'] + data['VarF']*2)/2, 
                                    0).ewm(span=3, adjust=False).mean() / 618 * data['Var10']
            
            # 确保资金入场为正值
            data['资金入场'] = np.where(data['资金入场'] > 0, data['资金入场'], 0)
            
            # 今量等于资金入场
            data['今量'] = data['资金入场']
            
            # 删除中间计算列，减少内存占用
            cols_to_keep = ['日期', 'OPEN', 'HIGH', 'LOW', 'CLOSE', '成交量', '成交额', '换手率', 
                           'VarA', 'VarE', 'MA_CLOSE_58', '资金入场', '今量']
            data = data[cols_to_keep]
            
            return data
        except Exception as e:
            print(f"计算指标时出错: {e}")
            print(traceback.format_exc())
            return None
    
    def check_signal(self, data):
        """检查是否出现买入信号"""
        try:
            if data is None or len(data) < 2:
                return False
            
            # 获取最新两天的数据
            latest = data.iloc[-1]
            previous = data.iloc[-2]
            
            # 买入信号：资金入场从0变为正值
            if previous['资金入场'] == 0 and latest['资金入场'] > 0:
                return True
            
            return False
        except Exception as e:
            print(f"检查信号时出错: {e}")
            print(traceback.format_exc())
            return False
    
    def scan_stocks(self, stocks_data):
        """扫描所有股票，找出符合条件的股票"""
        try:
            signals = []
            
            if not stocks_data:
                print("没有股票数据可供扫描")
                return pd.DataFrame()
            
            total = len(stocks_data)
            processed = 0
            
            for code, stock_info in stocks_data.items():
                try:
                    processed += 1
                    if processed % 100 == 0:
                        print(f"已处理 {processed}/{total} 只股票")
                        
                    name = stock_info['name']
                    data = stock_info['data']
                    
                    # 计算指标
                    result = self.calculate_indicators(data)
                    
                    # 检查信号
                    if result is not None and self.check_signal(result):
                        latest_data = result.iloc[-1]
                        signals.append({
                            '代码': code,
                            '名称': name,
                            '日期': latest_data['日期'],
                            '收盘价': latest_data['CLOSE'],
                            '资金入场': latest_data['资金入场']
                        })
                        print(f"发现信号: {code} {name}")
                except Exception as e:
                    print(f"处理股票 {code} 时出错: {e}")
                    continue
            
            print(f"扫描完成，共发现 {len(signals)} 只符合条件的股票")
            return pd.DataFrame(signals)
        except Exception as e:
            print(f"扫描股票时出错: {e}")
            print(traceback.format_exc())
            return pd.DataFrame() 