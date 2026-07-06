// 时钟和每日一言Pjax兼容处理
document.addEventListener('pjax:send', function() {
  // Pjax开始时隐藏时钟，防止显示异常
  const clock = document.getElementById('hexo_electric_clock');
  if (clock) {
    clock.style.display = 'none';
  }
});

document.addEventListener('pjax:complete', function() {
  // 等待DOM更新完成后重新初始化
  setTimeout(function() {
    // 1. 重新初始化时钟
    if (document.getElementById('hexo_electric_clock')) {
      if (typeof getIpAndWeather === 'function') {
        getIpAndWeather('杭州');
      }
    }
    
    // 2. 调整每日一言顺序 - 插入到时钟后面
    var asideContent = document.getElementById('aside-content');
    if (asideContent) {
      var dailyCard = asideContent.querySelector('.daily-card');
      var clockCard = asideContent.querySelector('.card-clock');
      
      if (dailyCard && clockCard) {
        // 检查每日一言是否已经在时钟后面
        var nextElement = clockCard.nextSibling;
        if (nextElement !== dailyCard) {
          // 如果不在正确位置，移动它
          asideContent.insertBefore(dailyCard, clockCard.nextSibling);
        }
      }
    }
  }, 500);
});