document.addEventListener('DOMContentLoaded', function () {
  var runtimeEl = document.getElementById('runtimeshow')
  var footerEl = document.querySelector('.footer-copyright')
  if (!runtimeEl || !footerEl) return

  var publishDate = runtimeEl.getAttribute('data-publishDate')
  if (!publishDate) return

  var startTime = new Date(publishDate).getTime()
  if (isNaN(startTime)) return

  var span = document.createElement('span')
  span.className = 'footer-runtime'
  span.style.marginLeft = '8px'
  footerEl.appendChild(span)

  function updateRuntime() {
    var now = new Date().getTime()
    var diff = now - startTime

    if (diff < 0) {
      span.textContent = ''
      return
    }

    var seconds = Math.floor(diff / 1000)
    var minutes = Math.floor(seconds / 60)
    var hours = Math.floor(minutes / 60)
    var days = Math.floor(hours / 24)
    var months = Math.floor(days / 30)
    var years = Math.floor(days / 365)

    var remainDays = days - years * 365
    var remainHours = hours - days * 24
    var remainMinutes = minutes - hours * 60
    var remainSeconds = seconds - minutes * 60

    span.textContent = '| 已运行 ' + years + ' 年 ' + remainDays + ' 天 ' + remainHours + ' 时 ' + remainMinutes + ' 分 ' + remainSeconds + ' 秒'
  }

  updateRuntime()
  setInterval(updateRuntime, 1000)

  // 不蒜子访客统计 - 在页脚显示 PV/UV
  var statsSpan = document.createElement('span')
  statsSpan.className = 'footer-stats'
  statsSpan.style.marginLeft = '8px'
  statsSpan.innerHTML = '| 访客 <span id="busuanzi_value_site_uv"><i class="fa-solid fa-spinner fa-spin"></i></span> | 浏览 <span id="busuanzi_value_site_pv"><i class="fa-solid fa-spinner fa-spin"></i></span>'
  footerEl.appendChild(statsSpan)

  // 安知鱼风格：工作时间/下班状态
  var workSpan = document.createElement('span')
  workSpan.className = 'footer-work-status'
  workSpan.style.marginLeft = '8px'
  footerEl.appendChild(workSpan)

  function updateWorkStatus() {
    var now = new Date()
    var hour = now.getHours()
    var minute = now.getMinutes()
    var currentTime = hour * 60 + minute

    // 工作时间：8:30 - 17:30
    var workStart = 8 * 60 + 30  // 8:30
    var workEnd = 17 * 60 + 30   // 17:30

    var isWorkTime = currentTime >= workStart && currentTime < workEnd

    if (isWorkTime) {
      workSpan.innerHTML = '| <i class="fa-solid fa-briefcase"></i> 工作中'
    } else {
      workSpan.innerHTML = '| <i class="fa-solid fa-house"></i> 下班啦'
    }
  }

  updateWorkStatus()
  setInterval(updateWorkStatus, 60000) // 每分钟检查一次
})