#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
启动A股选股系统
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入Flask应用
from src.app import app

if __name__ == '__main__':
    print("正在启动A股选股系统...")
    print("请在浏览器中访问 http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000) 