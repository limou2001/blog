// ==========================
// 🧭 调试开关
// ==========================
var DEBUG_MODE = false;
function debugLog(...args) {
  if (DEBUG_MODE) console.log(...args);
}

// ==========================
// 🕓 时钟与天气展示
// ==========================
var _clockTimer = null; // 保存定时器ID，防止Pjax下重复创建

function clockUpdateTime(info, city, timezone = 'Asia/Shanghai') {
  const clock_box = document.getElementById('hexo_electric_clock');
  if (!clock_box) return;

  // 清除旧的定时器，防止多个实例叠加
  if (_clockTimer) { clearInterval(_clockTimer); _clockTimer = null; }

  let currentColor = '#000';
  switch (info.now.icon) {
    case '100': currentColor = '#fdcc45'; break;
    case '101': currentColor = '#fe6976'; break;
    case '102': case '103': currentColor = '#fe7f5b'; break;
    case '104': case '150': case '151': case '152': case '153': case '154':
    case '800': case '801': case '802': case '803': case '804': case '805':
    case '806': case '807': currentColor = '#2152d1'; break;
    case '300': case '301': case '305': case '306': case '307': case '308':
    case '309': case '310': case '311': case '312': case '313': case '314':
    case '315': case '316': case '317': case '318': case '350': case '351':
    case '399': currentColor = '#49b1f5'; break;
    case '302': case '303': case '304': currentColor = '#fdcc46'; break;
    case '400': case '401': case '402': case '403': case '404': case '405':
    case '406': case '407': case '408': case '409': case '410': case '456':
    case '457': case '499': currentColor = '#a3c2dc'; break;
    case '500': case '501': case '502': case '503': case '504': case '507':
    case '508': case '509': case '510': case '511': case '512': case '513':
    case '514': case '515': currentColor = '#97acba'; break;
    case '900': case '999': currentColor = 'red'; break;
    case '901': currentColor = '#179fff'; break;
  }

  clock_box.innerHTML = `
    <div class="clock-row">
      <span id="card-clock-clockdate" class="card-clock-clockdate"></span>
      <span class="card-clock-weather"><i class="qi-${info.now.icon}-fill" style="color: ${currentColor}"></i> ${info.now.text} <span>${info.now.temp}</span> ℃</span>
      <span class="card-clock-humidity">💧 ${info.now.humidity}%</span>
    </div>
    <div class="clock-row">
      <span id="card-clock-time" class="card-clock-time"></span>
    </div>
    <div class="clock-row">
      <span class="card-clock-windDir"> <i class="qi-gale"></i> ${info.now.windDir}</span>
      <span class="card-clock-location">${city}</span>
      <span id="card-clock-dackorlight" class="card-clock-dackorlight"></span>
    </div>
  `;

  const week = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  function zeroPadding(num,d){return('0'.repeat(d)+num).slice(-d);}

  function updateTime() {
    // Pjax导航后DOM元素可能已不存在，需做null检查
    var timeEl = document.getElementById('card-clock-time');
    var dateEl = document.getElementById('card-clock-clockdate');
    var ampmEl = document.getElementById('card-clock-dackorlight');
    if (!timeEl || !dateEl || !ampmEl) {
      clearInterval(_clockTimer); _clockTimer = null; return;
    }
    const now = new Date();
    const options = { timeZone: timezone, hour12: false };
    const timeString = now.toLocaleString('en-US', options);
    const cd = new Date(timeString);

    timeEl.innerHTML =
      zeroPadding(cd.getHours(),2)+':'+zeroPadding(cd.getMinutes(),2)+':'+zeroPadding(cd.getSeconds(),2);
    dateEl.innerHTML =
      `${cd.getFullYear()}-${zeroPadding(cd.getMonth()+1,2)}-${zeroPadding(cd.getDate(),2)} ${week[cd.getDay()]}`;
    ampmEl.innerHTML = cd.getHours()>12?' P M':' A M';
  }

  _clockTimer = setInterval(updateTime,1000);
  updateTime();
}

// ==========================
// 🌦️ 主流程：IP + 天气
// ==========================
function getIpAndWeather(default_city = '') {
  const fetchCityWeather = (cityName) => {
    debugLog('🔍 使用城市:', cityName);

    const geoUrl = `${qweather_api_host}/geo/v2/city/lookup?location=${encodeURIComponent(cityName)}&key=${qweather_key}`;
    fetch(geoUrl)
      .then(res => res.json())
      .then(geoData => {
        const location = geoData.location?.[0];
        if (!location) throw new Error('未找到 location id');

        const locationId = location.id;
        const timezone = location.tz || 'Asia/Shanghai';
        debugLog('🔍 location id:', locationId, '🕐 时区:', timezone);

        const weatherUrl = `${qweather_api_host}/v7/weather/now?location=${locationId}&key=${qweather_key}`;
        return fetch(weatherUrl)
          .then(res => res.json())
          .then(weatherData => {
            debugLog('🔍 天气数据:', weatherData);
            clockUpdateTime(weatherData, cityName, timezone);
          });
      })
      .catch(err => console.error('❌ 获取城市或天气错误:', err));
  };

  if (default_city && default_city.trim() !== '') {
    // 有默认城市 → 直接使用
    fetchCityWeather(default_city);
  } else {
    // 无默认城市 → IP定位
    fetch('https://api.vore.top/api/IPdata?ip=')
      .then(res => res.json())
      .then(ipData => {
        const cityName = ipData.ipdata.info3 || ipData.ipdata.info2 || '未知城市';
        fetchCityWeather(cityName);
      })
      .catch(err => console.error('❌ IP接口错误:', err));
  }
}

// ==========================
// 🚀 调用示例
// ==========================
// 示例1：使用 IP 自动定位城市
// getIpAndWeather();

// 示例2：指定默认城市（洛杉矶）
// getIpAndWeather('洛杉矶');

// 示例3：国内默认城市（深圳）
// getIpAndWeather('深圳');

// 实际运行 - 防止Pjax重复执行
if (typeof default_city !== 'undefined') {
  getIpAndWeather(default_city);
}
