// 食物图标匹配工具
// 使用多个开源图标库

// 食物名称对应的图标映射表
const foodIconMap = {
  // 中餐
  '火锅': 'hot-pot',
  '寿司': 'sushi',
  '炒饭': 'fried-rice',
  '拉面': 'noodles',
  '面条': 'noodles',
  '饺子': 'dumpling',
  '包子': 'bun',
  '粽子': 'zongzi',
  '烧烤': 'barbecue',
  '麻辣烫': 'spicy-pot',
  '冒菜': 'spicy-soup',
  '盖浇饭': 'rice-bowl',
  '米饭': 'rice',
  '馒头': 'steamed-bun',
  '豆浆': 'soy-milk',
  '油条': 'fried-dough',
  '小笼包': 'steamed-bun',
  '煎饼': 'pancake',
  '麻辣香锅': 'spicy-pot',
  '串串香': 'skewer',
  
  // 西餐
  '汉堡': 'burger',
  '披萨': 'pizza',
  '牛排': 'steak',
  '三明治': 'sandwich',
  '意面': 'pasta',
  '烤肉': 'roast-meat',
  '薯条': 'fries',
  '沙拉': 'salad',
  '匹萨': 'pizza',
  '法棍': 'baguette',
  '蛋糕': 'cake',
  '甜品': 'dessert',
  '奶茶': 'milk-tea',
  '咖啡': 'coffee',
  
  // 日韩料理
  '刺身': 'sashimi',
  '生鱼片': 'sashimi',
  '日式拉面': 'ramen',
  '韩国烤肉': 'korean-bbq',
  '韩式炸鸡': 'fried-chicken',
  '寿喜锅': 'sukiyaki',
  '天妇罗': 'tempura',
  '章鱼小丸子': 'takoyaki',
  '泡菜': 'kimchi',
  '石锅拌饭': 'bibimbap',

  // 快餐小吃
  '炸鸡': 'fried-chicken',
  '鸡排': 'chicken-cutlet',
  '臭豆腐': 'stinky-tofu',
  '关东煮': 'oden',
  '鸡蛋灌饼': 'pancake',
  '肉夹馍': 'chinese-burger',
  '烤冷面': 'cold-noodles',
  '烤肠': 'sausage',
  '手抓饼': 'pancake',
  '煎饺': 'fried-dumpling',
  
  // 饮品
  '珍珠奶茶': 'bubble-tea',
  '可乐': 'cola',
  '咖啡': 'coffee',
  '果汁': 'juice',
  '啤酒': 'beer',
  '红酒': 'wine',
  '奶昔': 'milkshake',
  '豆浆': 'soy-milk',
  '柠檬水': 'lemonade',

  // 补充常见食物
  '烤鸭': 'roast-duck',
  '西红柿鸡蛋': 'tomato-egg',
  '红烧肉': 'braised-pork',
  '小龙虾': 'crayfish',
  '酸菜鱼': 'sour-fish',
  '土豆': 'potato',
  '蔬菜': 'vegetables',
  '水果': 'fruits',
  '牛肉': 'beef',
  '鸡肉': 'chicken',
  '猪肉': 'pork',
  '羊肉': 'mutton'
};

// 艺术字体类型与效果
const fontStyles = [
  {name: 'normal', className: ''},
  {name: 'bold', className: 'text-bold'},
  {name: 'shadow', className: 'text-shadow'},
  {name: 'neon', className: 'text-neon'},
  {name: 'retro', className: 'text-retro'},
  {name: 'pixel', className: 'text-pixel'},
  {name: 'comic', className: 'text-comic'},
  {name: 'animated', className: 'text-animated'}
];

// 备用图标源
const iconSources = [
  {
    name: 'icons8',
    baseUrl: 'https://img.icons8.com/color/48/000000/',
    extension: '.png'
  },
  {
    name: 'flaticon',
    baseUrl: 'https://cdn-icons-png.flaticon.com/128/',
    extension: '.png'
  },
  {
    name: 'emoji',
    baseUrl: 'https://em-content.zobj.net/thumbs/120/apple/325/',
    extension: '.png',
    prefix: 'emoji-'
  }
];

// 备用图标映射
const backupIcons = {
  'hot-pot': ['emoji-hot-pot_1f372', 'chinese-food_1236457'],
  'sushi': ['emoji-sushi_1f363', 'sushi_1323306'],
  'burger': ['emoji-hamburger_1f354', 'burger_1323306'],
  'pizza': ['emoji-pizza_1f355', 'pizza_1323306'],
  'noodles': ['emoji-steaming-bowl_1f35c', 'noodles_1323306'],
  'coffee': ['emoji-hot-beverage_2615', 'coffee_1323306'],
  'rice': ['emoji-cooked-rice_1f35a', 'rice_1323306'],
  'beer': ['emoji-beer-mug_1f37a', 'beer_1323306']
};

// 尝试匹配食物对应的图标
function matchFoodIcon(foodName) {
  if (!foodName || typeof foodName !== 'string') {
    return getDefaultArtText();
  }

  // 转换为小写以进行不区分大小写的匹配
  const normalizedName = foodName.trim().toLowerCase();
  
  // 如果直接匹配成功
  if (foodIconMap[normalizedName] || foodIconMap[foodName]) {
    const iconKey = foodIconMap[normalizedName] || foodIconMap[foodName];
    return {
      type: 'icon',
      value: iconKey,
      source: getIconSource(iconKey)
    };
  }
  
  // 尝试部分匹配
  for (const key in foodIconMap) {
    if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
      const iconKey = foodIconMap[key];
      return {
        type: 'icon',
        value: iconKey,
        source: getIconSource(iconKey)
      };
    }
  }
  
  // 无法匹配图标，返回艺术字样式
  return getDefaultArtText();
}

// 获取默认艺术字样式
function getDefaultArtText() {
  const randomStyle = fontStyles[Math.floor(Math.random() * fontStyles.length)];
  return {
    type: 'artText',
    value: randomStyle.name,
    className: randomStyle.className
  };
}

// 确定图标源
function getIconSource(iconKey) {
  // 检查是否有备用图标
  if (backupIcons[iconKey]) {
    // 在不同源中轮流选择
    const backupOptions = backupIcons[iconKey];
    // 随机选择备用图标之一
    const randomIndex = Math.floor(Math.random() * (backupOptions.length + 1));
    
    // 如果选择了原始图标
    if (randomIndex >= backupOptions.length) {
      return iconSources[0]; // 默认使用icons8
    }
    
    // 从备用选项中提取前缀
    const backupIcon = backupOptions[randomIndex];
    // 确定源
    for (const source of iconSources) {
      if (backupIcon.startsWith(source.prefix || '')) {
        return {
          ...source,
          customKey: backupIcon
        };
      }
    }
    
    // 默认使用第一个源
    return {
      ...iconSources[0],
      customKey: backupIcon
    };
  }
  
  // 没有备用图标，使用默认源
  return iconSources[0];
}

// 获取图标CDN URL
function getIconUrl(iconName, source) {
  if (!source) {
    source = iconSources[0]; // 默认使用icons8
  }

  // 如果有自定义键，使用它
  const key = source.customKey || (iconName + source.extension);
  return `${source.baseUrl}${key}`;
}

// 从网络获取图标并转为base64
function fetchIconAsBase64(iconName, source) {
  // 小程序环境下可以直接使用网络图片，无需转base64
  return new Promise((resolve) => {
    const iconUrl = getIconUrl(iconName, source);
    resolve(iconUrl);
  });
}

// 生成食物艺术字样式
function generateArtText(style, text) {
  // 返回艺术字的样式对象
  switch(style) {
    case 'bold':
      return { 
        fontWeight: 'bold', 
        fontSize: '34rpx'
      };
    case 'italic':
      return { 
        fontStyle: 'italic', 
        fontSize: '30rpx'
      };
    case 'shadow':
      return { 
        textShadow: '4rpx 4rpx 6rpx rgba(0,0,0,0.5)', 
        fontSize: '32rpx'
      };
    case 'neon':
      return { 
        textShadow: '0 0 10rpx #fff, 0 0 20rpx #fff, 0 0 30rpx #fff, 0 0 40rpx #ff00de, 0 0 70rpx #ff00de', 
        color: '#fff', 
        fontSize: '30rpx'
      };
    case 'retro':
      return { 
        fontFamily: 'serif', 
        letterSpacing: '2rpx', 
        fontSize: '28rpx'
      };
    case 'pixel':
      return { 
        fontFamily: 'monospace', 
        fontSize: '32rpx',
        letterSpacing: '1rpx'
      };
    case 'comic':
      return { 
        fontFamily: 'cursive', 
        fontSize: '30rpx'
      };
    case 'animated':
      return {
        animation: 'textGlow 2s infinite',
        fontSize: '32rpx'
      };
    default:
      return { 
        fontSize: '32rpx'
      };
  }
}

module.exports = {
  matchFoodIcon,
  getIconUrl,
  fetchIconAsBase64,
  generateArtText,
  fontStyles
}; 