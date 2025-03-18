# A股选股系统

基于"资金入场"策略的A股选股工具，自动获取A股数据并根据策略生成选股信号。

## 功能特点

- 自动获取A股股票数据（剔除北交所、ST和科创板）
- 基于"资金入场"策略进行选股
- 提供Web界面展示选股结果
- 支持手动刷新数据
- 定时任务自动更新数据（每个交易日开盘前和收盘后）

## 技术栈

- 后端：Python、Flask、AKShare、Pandas
- 前端：HTML、CSS、JavaScript、Bootstrap

## 安装与使用

### 环境要求

- Python 3.8+
- pip 包管理工具

### 安装步骤

1. 克隆或下载本项目到本地

2. 安装依赖包

```bash
cd stock_selector
pip install -r requirements.txt
```

3. 运行应用

```bash
cd src
python app.py
```

4. 在浏览器中访问 http://localhost:5000 查看应用

## 选股策略说明

本系统使用"资金入场"策略选股，该策略基于以下技术指标：

```
Var1:=EMA(HHV(HIGH,500),21);
Var2:=EMA(HHV(HIGH,250),21);
Var3:=EMA(HHV(HIGH,90),21);
Var4:=EMA(LLV(LOW,500),21);
Var5:=EMA(LLV(LOW,250),21);
Var6:=EMA(LLV(LOW,90),21);
Var7:=EMA((Var4*0.96+Var5*0.96+Var6*0.96+Var1*0.558+Var2*0.558+Var3*0.558)/6,21);
Var8:=EMA((Var4*1.25+Var5*1.23+Var6*1.2+Var1*0.55+Var2*0.55+Var3*0.65)/6,21);
Var9:=EMA((Var4*1.3+Var5*1.3+Var6*1.3+Var1*0.68+Var2*0.68+Var3*0.68)/6,21);
VarA:=EMA((Var7*3+Var8*2+Var9)/6*1.738,21);
VarB:=REF(LOW,1);
VarC:=SMA(ABS(LOW-VarB),3,1)/SMA(MAX(LOW-VarB,0),3,1)*100;
VarD:=EMA(IF(CLOSE*1.35<=VarA,VarC*10,VarC/10),3);
VarE:=LLV(LOW,30);
VarF:=HHV(VarD,30);
Var10:=IF(MA(CLOSE,58),1,0);
资金入场:EMA(IF(LOW<=VarE,(VarD+VarF*2)/2,0),3)/618*Var10;
资金入场：IF(资金入场>0,资金入场,0);
```

当"资金入场"指标从0变为正值时，系统会发出买入信号。

## 项目结构

```
stock_selector/
├── data/                  # 数据存储目录
├── src/                   # 源代码目录
│   ├── app.py             # Flask应用主程序
│   ├── data_fetcher.py    # 数据获取模块
│   ├── strategy.py        # 选股策略模块
│   ├── static/            # 静态资源
│   │   ├── css/           # CSS样式
│   │   └── js/            # JavaScript脚本
│   └── templates/         # HTML模板
│       └── index.html     # 首页模板
└── requirements.txt       # 依赖包列表
```

## 注意事项

- 本系统仅供学习和研究使用，不构成投资建议
- 股票投资有风险，请谨慎决策
- 首次运行时，数据获取可能需要较长时间，请耐心等待

## 数据来源

本系统使用AKShare获取A股数据，感谢AKShare项目的贡献。

## 许可证

MIT 