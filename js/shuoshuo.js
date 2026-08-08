/* ==========================================
 * 说说页面 - 瀑布流卡片渲染
 * ========================================== */
(function() {
  function getRandomBgClass() {
    var bgClasses = ['bg-1', 'bg-2', 'bg-3', 'bg-4', 'bg-5', 'bg-6', 'bg-7', 'bg-8'];
    return bgClasses[Math.floor(Math.random() * bgClasses.length)];
  }

  function formatDate(dateStr) {
    var date = new Date(dateStr);
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return month + '月' + day + '日';
  }

  function groupByYearMonth(entries) {
    var yearGroups = {};
    entries.forEach(function(entry) {
      var date = new Date(entry.date);
      var year = date.getFullYear();
      var month = date.getMonth() + 1;

      if (!yearGroups[year]) {
        yearGroups[year] = { year: year, months: {} };
      }
      if (!yearGroups[year].months[month]) {
        yearGroups[year].months[month] = { month: month, entries: [] };
      }
      yearGroups[year].months[month].entries.push(entry);
    });

    return Object.values(yearGroups).sort(function(a, b) { return b.year - a.year; }).map(function(yearGroup) {
      return {
        year: yearGroup.year,
        months: Object.values(yearGroup.months).sort(function(a, b) { return b.month - a.month; })
      };
    });
  }

  function loadEntries() {
    return fetch('/data/shuoshuo.json')
      .then(function(response) { return response.json(); })
      .then(function(data) { return data.entries || []; })
      .catch(function(e) {
        console.error('加载说说数据失败:', e);
        return [];
      });
  }

  function renderCards() {
    var container = document.getElementById('shuoshuo-cards');
    if (!container) return;

    container.innerHTML = '';

    loadEntries().then(function(entries) {
      var yearGroups = groupByYearMonth(entries);

      yearGroups.forEach(function(yearGroup) {
        var yearSection = document.createElement('div');
        yearSection.className = 'shuoshuo-year-section';
        yearSection.innerHTML = '<div class="shuoshuo-year-title">' + yearGroup.year + ' 年</div>';

        yearGroup.months.forEach(function(monthGroup) {
          var monthSection = document.createElement('div');
          monthSection.className = 'shuoshuo-month-section';
          monthSection.innerHTML = '<div class="shuoshuo-month-title">' + monthGroup.month + ' 月</div>';

          var waterfall = document.createElement('div');
          waterfall.className = 'shuoshuo-waterfall';

          monthGroup.entries.forEach(function(entry) {
            var card = document.createElement('div');
            var bgClass = getRandomBgClass();
            var hasImage = entry.image && entry.image.trim() !== '';

            card.className = 'shuoshuo-card ' + bgClass + (hasImage ? ' has-image' : '');

            var cardItem = document.createElement('div');
            cardItem.className = 'shuoshuo-card-item';
            cardItem.innerHTML = '<div class="shuoshuo-card-date">' + formatDate(entry.date) + '</div>';

            var html = '<div class="glass-overlay"></div>';

            if (hasImage) {
              html += '<div class="shuoshuo-card-image"><img src="' + entry.image + '" alt=""></div>';
            }

            var content = entry.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html += '<div class="shuoshuo-card-content"><div class="content-bg">' + content + '</div></div>';

            card.innerHTML = html;
            cardItem.appendChild(card);
            waterfall.appendChild(cardItem);
          });

          monthSection.appendChild(waterfall);
          yearSection.appendChild(monthSection);
        });

        container.appendChild(yearSection);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCards);
  } else {
    renderCards();
  }

  document.addEventListener('pjax:complete', renderCards);
})();
