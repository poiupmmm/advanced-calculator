# 高级在线计算器

一个功能强大的在线计算器应用，支持多种计算模式和现代用户界面。

## 特性

- **多种计算模式**：
  - 基础计算：加、减、乘、除等基本运算
  - 科学计算：三角函数、对数、指数等高级函数
  - 微积分：微分、积分等微积分运算
  - 方程：方程求解功能

- **现代用户界面**：
  - 响应式设计，适配各种屏幕尺寸
  - 深色/浅色模式自动适配系统设置
  - 清晰的计算历史记录
  - 动态调整字体大小，确保可读性

- **高级功能**：
  - 使用Web Worker进行后台计算，不阻塞UI
  - 完整的计算历史记录，可点击复用表达式
  - 根据屏幕方向（横向/纵向）优化布局

## 技术栈

- **前端**：
  - Next.js 14 (App Router)
  - React
  - TypeScript
  - Tailwind CSS
  - Web Workers

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## 项目结构

```
app/
├── components/           # 组件
│   └── calculator/       # 计算器组件
│       ├── Button.tsx    # 按钮组件
│       ├── Calculator.tsx # 主计算器组件
│       ├── Display.tsx   # 显示屏组件
│       ├── HistoryPanel.tsx # 历史记录面板
│       ├── Keypad.tsx    # 键盘组件
│       └── ModeSwitch.tsx # 模式切换组件
├── contexts/             # React上下文
│   └── CalculatorContext.tsx # 计算器状态上下文
├── hooks/                # React钩子
│   └── useCalculator.ts  # 计算器钩子
├── types/                # TypeScript类型定义
│   └── calculator.ts     # 计算器相关类型
├── utils/                # 工具函数
│   └── formatters.ts     # 格式化函数
└── workers/              # Web Workers
    └── calculator.worker.ts # 计算器Worker
```

## 贡献

欢迎贡献！请随时提交问题或拉取请求。

## 许可

MIT 