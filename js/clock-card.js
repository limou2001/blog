document.addEventListener('DOMContentLoaded', function () {
  var asideContent = document.getElementById('aside-content')
  if (!asideContent) return

  // ============ 时段配置：每个时段对应壁纸 + 问候语 + 图标 ============
  // 壁纸使用 Unsplash Source API（按关键词获取随机美图，免 Key、稳定）
  var periods = [
    {
      range: [0, 5],
      name: '深夜',
      icon: 'fa-solid fa-moon',
      greeting: '夜深了，注意休息',
      query: 'night,stars,galaxy'
    },
    {
      range: [5, 8],
      name: '清晨',
      icon: 'fa-solid fa-sun',
      greeting: '清晨好，新的一天开始',
      query: 'sunrise,morning'
    },
    {
      range: [8, 11],
      name: '上午',
      icon: 'fa-solid fa-sun',
      greeting: '上午好，加油呀',
      query: 'blue,sky,clouds'
    },
    {
      range: [11, 13],
      name: '中午',
      icon: 'fa-solid fa-sun',
      greeting: '中午好，记得吃饭',
      query: 'sun,bright'
    },
    {
      range: [13, 17],
      name: '下午',
      icon: 'fa-solid fa-cloud-sun',
      greeting: '下午好，喝杯茶吧',
      query: 'afternoon,landscape'
    },
    {
      range: [17, 19],
      name: '傍晚',
      icon: 'fa-solid fa-cloud-sun-rain',
      greeting: '傍晚好，看日落啦',
      query: 'sunset,dusk'
    },
    {
      range: [19, 22],
      name: '晚上',
      icon: 'fa-solid fa-cloud-moon',
      greeting: '晚上好，放松一下',
      query: 'evening,city,lights'
    },
    {
      range: [22, 24],
      name: '深夜',
      icon: 'fa-solid fa-moon',
      greeting: '夜深了，早点休息',
      query: 'night,stars,galaxy'
    }
  ]

  function getPeriod (h) {
    for (var i = 0; i < periods.length; i++) {
      if (h >= periods[i].range[0] && h < periods[i].range[1]) {
        return periods[i]
      }
    }
    return periods[0]
  }

  // ============ 构建 SVG 指针时钟 ============
  function buildAnalogClockSVG () {
    var svg = '<svg class="analog-clock" viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">'
    // 表盘
    svg += '<circle class="clock-face" cx="55" cy="55" r="50"/>'

    // 12 个刻度
    for (var i = 0; i < 60; i++) {
      var angle = (i * 6 - 90) * Math.PI / 180
      var isMajor = i % 5 === 0
      var r1 = isMajor ? 42 : 45
      var r2 = 48
      var x1 = 55 + r1 * Math.cos(angle)
      var y1 = 55 + r1 * Math.sin(angle)
      var x2 = 55 + r2 * Math.cos(angle)
      var y2 = 55 + r2 * Math.sin(angle)
      svg += '<line class="clock-mark' + (isMajor ? ' clock-mark-major' : '') +
             '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>'
    }

    // 4 个数字（12 / 3 / 6 / 9）
    var numbers = [
      { num: 12, x: 55, y: 20 },
      { num: 3, x: 90, y: 55 },
      { num: 6, x: 55, y: 90 },
      { num: 9, x: 20, y: 55 }
    ]
    numbers.forEach(function (n) {
      svg += '<text class="clock-number" x="' + n.x + '" y="' + n.y + '">' + n.num + '</text>'
    })

    // 时针（短而粗）
    svg += '<line class="clock-hand-hour" x1="55" y1="55" x2="55" y2="32"/>'
    // 分针（中等长度）
    svg += '<line class="clock-hand-minute" x1="55" y1="55" x2="55" y2="22"/>'
    // 秒针（细长，橙色）
    svg += '<line class="clock-hand-second" x1="55" y1="60" x2="55" y2="18"/>'

    // 中心圆点
    svg += '<circle class="clock-center" cx="55" cy="55" r="3.5"/>'

    svg += '</svg>'
    return svg
  }

  // ============ 创建卡片 DOM ============
  var card = document.createElement('div')
  card.className = 'clock-card'
  card.innerHTML =
    '<div class="clock-period-tag"><i class=""></i><span>--</span></div>' +
    '<div class="clock-card-content">' +
    '  <div class="clock-date-row">' +
    '    <span class="clock-date-text">--</span>' +
    '    <span class="clock-weekday">--</span>' +
    '  </div>' +
    buildAnalogClockSVG() +
    '  <div class="clock-digital">' +
    '    <span class="clock-hm">00:00</span>' +
    '    <span class="clock-seconds">00</span>' +
    '  </div>' +
    '  <div class="clock-greeting">--</div>' +
    '</div>'

  var firstCard = asideContent.querySelector('.card-widget')
  if (firstCard && firstCard.nextSibling) {
    asideContent.insertBefore(card, firstCard.nextSibling)
  } else {
    asideContent.insertBefore(card, asideContent.firstChild)
  }

  // 缓存 DOM 引用
  var dateEl = card.querySelector('.clock-date-text')
  var weekdayEl = card.querySelector('.clock-weekday')
  var hmEl = card.querySelector('.clock-hm')
  var secondsEl = card.querySelector('.clock-seconds')
  var greetingEl = card.querySelector('.clock-greeting')
  var periodIconEl = card.querySelector('.clock-period-tag i')
  var periodNameEl = card.querySelector('.clock-period-tag span')
  var hourHand = card.querySelector('.clock-hand-hour')
  var minuteHand = card.querySelector('.clock-hand-minute')
  var secondHand = card.querySelector('.clock-hand-second')

  var weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  function pad (n) {
    return n < 10 ? '0' + n : '' + n
  }

  // ============ 更新背景壁纸 ============
  var lastPeriodName = ''
  var lastBgDate = ''

  function updateBackground (period) {
    // 同一时段且同一天内不重复请求
    var todayKey = new Date().toDateString()
    if (period.name === lastPeriodName && todayKey === lastBgDate) return
    lastPeriodName = period.name
    lastBgDate = todayKey

    // 使用 Picsum Photos（Lorem Picsum），稳定可靠、免 Key
    // seed 由时段关键词 + 当天日期组成：每天每时段一张固定美图，次日自动换新
    var seed = encodeURIComponent(period.query + '-' + todayKey)
    var imgUrl = 'https://picsum.photos/seed/' + seed + '/400/300'

    // 预加载，避免闪烁
    var img = new Image()
    img.onload = function () {
      card.classList.add('bg-changing')
      card.style.backgroundImage = 'url("' + imgUrl + '")'
      setTimeout(function () { card.classList.remove('bg-changing') }, 800)
    }
    img.onerror = function () {
      // Picsum 失败：降级为渐变色背景
      card.style.backgroundImage = 'linear-gradient(135deg, #49B1F5 0%, #00c4b6 100%)'
    }
    img.src = imgUrl

    // 更新时段标签
    periodIconEl.className = period.icon
    periodNameEl.textContent = period.name
  }

  // ============ 主更新函数 ============
  function update () {
    var now = new Date()
    var y = now.getFullYear()
    var m = now.getMonth() + 1
    var d = now.getDate()
    var h = now.getHours()
    var min = now.getMinutes()
    var s = now.getSeconds()
    var ms = now.getMilliseconds()
    var w = now.getDay()

    // 日期 + 星期
    dateEl.textContent = y + '年' + m + '月' + d + '日'
    weekdayEl.textContent = weekdays[w]

    // 数字时间
    hmEl.textContent = pad(h) + ':' + pad(min)
    secondsEl.textContent = pad(s)

    // 指针角度计算（含平滑过渡）
    // 秒针：精确到毫秒，连续旋转
    var secondAngle = (s + ms / 1000) * 6
    // 分针：含秒的小数部分，平滑移动
    var minuteAngle = (min + s / 60) * 6
    // 时针：含分秒，平滑移动
    var hourAngle = ((h % 12) + min / 60) * 30

    secondHand.style.transition = 'none'
    secondHand.style.transform = 'rotate(' + secondAngle + 'deg)'
    minuteHand.style.transform = 'rotate(' + minuteAngle + 'deg)'
    hourHand.style.transform = 'rotate(' + hourAngle + 'deg)'

    // 时段与问候
    var period = getPeriod(h)
    greetingEl.textContent = period.greeting
    updateBackground(period)
  }

  // 每 200ms 更新一次，秒针视觉上接近连续
  update()
  setInterval(update, 200)
})
