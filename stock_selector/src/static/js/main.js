document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noDataMessage = document.getElementById('noDataMessage');
    const tableContainer = document.getElementById('tableContainer');
    const stocksTableBody = document.getElementById('stocksTableBody');
    const lastUpdateElement = document.getElementById('lastUpdate');
    const refreshBtn = document.getElementById('refreshBtn');
    
    // 加载选股数据
    function loadStockSignals() {
        // 显示加载指示器
        loadingIndicator.style.display = 'block';
        tableContainer.style.display = 'none';
        noDataMessage.style.display = 'none';
        
        // 发送API请求
        fetch('/api/signals')
            .then(response => response.json())
            .then(data => {
                // 更新最后更新时间
                if (data.last_update) {
                    lastUpdateElement.textContent = `最后更新: ${data.last_update}`;
                } else {
                    lastUpdateElement.textContent = '最后更新: 暂无数据';
                }
                
                // 处理数据
                if (data.signals && data.signals.length > 0) {
                    // 清空表格
                    stocksTableBody.innerHTML = '';
                    
                    // 填充表格数据
                    data.signals.forEach(stock => {
                        const row = document.createElement('tr');
                        
                        // 创建单元格
                        const codeCell = document.createElement('td');
                        codeCell.textContent = stock.代码;
                        
                        const nameCell = document.createElement('td');
                        nameCell.textContent = stock.名称;
                        
                        const dateCell = document.createElement('td');
                        dateCell.textContent = stock.日期;
                        
                        const priceCell = document.createElement('td');
                        priceCell.textContent = stock.收盘价.toFixed(2);
                        
                        const signalCell = document.createElement('td');
                        signalCell.textContent = stock.资金入场.toFixed(4);
                        
                        // 添加单元格到行
                        row.appendChild(codeCell);
                        row.appendChild(nameCell);
                        row.appendChild(dateCell);
                        row.appendChild(priceCell);
                        row.appendChild(signalCell);
                        
                        // 添加行到表格
                        stocksTableBody.appendChild(row);
                    });
                    
                    // 显示表格
                    tableContainer.style.display = 'block';
                } else {
                    // 显示无数据消息
                    noDataMessage.style.display = 'block';
                }
                
                // 隐藏加载指示器
                loadingIndicator.style.display = 'none';
            })
            .catch(error => {
                console.error('获取数据失败:', error);
                // 显示错误消息
                noDataMessage.textContent = '获取数据失败，请稍后再试。';
                noDataMessage.style.display = 'block';
                loadingIndicator.style.display = 'none';
            });
    }
    
    // 刷新按钮点击事件
    refreshBtn.addEventListener('click', function() {
        // 禁用按钮，防止重复点击
        refreshBtn.disabled = true;
        refreshBtn.textContent = '更新中...';
        
        // 发送更新请求
        fetch('/api/update', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            // 重新加载数据
            setTimeout(() => {
                loadStockSignals();
                // 恢复按钮状态
                refreshBtn.disabled = false;
                refreshBtn.textContent = '刷新数据';
            }, 2000); // 延迟2秒，给后端处理时间
        })
        .catch(error => {
            console.error('更新数据失败:', error);
            // 恢复按钮状态
            refreshBtn.disabled = false;
            refreshBtn.textContent = '刷新数据';
            // 显示错误消息
            alert('更新数据失败，请稍后再试。');
        });
    });
    
    // 初始加载数据
    loadStockSignals();
}); 