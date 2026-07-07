document.addEventListener('DOMContentLoaded', function () {
  var footerEl = document.querySelector('.footer-copyright')
  if (!footerEl) return

  // 尝试从 #runtimeshow 获取日期，如果没有则使用默认值
  var runtimeEl = document.getElementById('runtimeshow')
  var publishDate = '2026/06/17 00:00:00' // 默认值
  if (runtimeEl) {
    var attrDate = runtimeEl.getAttribute('data-publishDate')
    if (attrDate) publishDate = attrDate
  }

  var startTime = new Date(publishDate).getTime()
  if (isNaN(startTime)) return

  // 检查是否已经添加过，避免重复
  if (footerEl.querySelector('.footer-runtime')) return

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