/* 随机推荐一首歌 - 自定义歌词面板 + 控制栏 */
(function () {
  var PLAYLIST_ID = '3778678'
  var API = 'https://api.injahow.cn/meting/?server=netease&type=playlist&id=' + PLAYLIST_ID
  var wrap = document.getElementById('music-player-wrap')
  var lrcBody = document.getElementById('music-lrc-body')
  var refreshBtn = document.getElementById('music-refresh')

  // 自定义控制栏元素
  var ctrlPlay = document.getElementById('music-ctrl-play')
  var ctrlPrev = document.getElementById('music-ctrl-prev')
  var ctrlNext = document.getElementById('music-ctrl-next')
  var ctrlTime = document.getElementById('music-ctrl-time')
  var ctrlBar = document.getElementById('music-ctrl-bar')
  var ctrlPlayed = document.getElementById('music-ctrl-played')
  var ctrlLoaded = document.getElementById('music-ctrl-loaded')
  var ctrlVolBtn = document.getElementById('music-ctrl-vol-btn')
  var ctrlVolBar = document.getElementById('music-ctrl-vol-bar')
  var ctrlVolFill = document.getElementById('music-ctrl-vol-fill')
  var ctrlSong = document.getElementById('music-ctrl-song')
  var infoName = document.getElementById('music-info-name')
  var infoArtist = document.getElementById('music-info-artist')
  var infoAlbum = document.getElementById('music-info-album')

  var ap = null
  var lrcData = []
  var currentLine = -1
  var isDragging = false

  /* ====== LRC 解析 ====== */
  function parseLrc(text) {
    if (!text) return []
    var lines = text.split('\n')
    var result = []
    var timeReg = /\[(\d{2}):(\d{2})([.:]\d{2,3})?\]/g
    lines.forEach(function (line) {
      var times = []
      var match
      while ((match = timeReg.exec(line)) !== null) {
        var min = parseInt(match[1], 10)
        var sec = parseInt(match[2], 10)
        var ms = match[3] ? parseFloat(match[3].replace(':', '.')) : 0
        times.push(min * 60 + sec + ms)
      }
      var txt = line.replace(/\[\d{2}:\d{2}([.:]\d{2,3})?\]/g, '').trim()
      if (txt.length === 0) return
      times.forEach(function (t) {
        result.push({ time: t, text: txt })
      })
    })
    result.sort(function (a, b) { return a.time - b.time })
    return result
  }

  /* ====== 渲染歌词 ====== */
  function renderLrc(data) {
    lrcData = data
    currentLine = -1
    if (!data.length) {
      lrcBody.innerHTML = '<div class="music-lrc-empty">暂无歌词</div>'
      return
    }
    var html = ''
    data.forEach(function (item, i) {
      html += '<div class="music-lrc-line" data-index="' + i + '">' + escHtml(item.text) + '</div>'
    })
    lrcBody.innerHTML = html
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  /* ====== 歌词同步 ====== */
  function updateLrc(time) {
    if (!lrcData.length || isDragging) return
    var line = -1
    for (var i = 0; i < lrcData.length; i++) {
      if (lrcData[i].time <= time) line = i
      else break
    }
    if (line === currentLine) return
    currentLine = line
    var lines = lrcBody.querySelectorAll('.music-lrc-line')
    lines.forEach(function (el, i) {
      if (i === line) el.classList.add('lrc-active')
      else el.classList.remove('lrc-active')
    })
    if (line >= 0 && lines[line]) {
      var el = lines[line]
      var bodyRect = lrcBody.getBoundingClientRect()
      var elRect = el.getBoundingClientRect()
      var offset = elRect.top - bodyRect.top - bodyRect.height / 2 + elRect.height / 2
      lrcBody.scrollTo({ top: lrcBody.scrollTop + offset, behavior: 'smooth' })
    }
  }

  /* ====== 格式化时间 ====== */
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00'
    var m = Math.floor(sec / 60)
    var s = Math.floor(sec % 60)
    return m + ':' + (s < 10 ? '0' : '') + s
  }

  /* ====== 更新控制栏 ====== */
  function updateControls() {
    if (!ap || !ap.audio) return
    var audio = ap.audio
    var cur = audio.currentTime || 0
    var dur = audio.duration || 0

    // 时间
    ctrlTime.textContent = formatTime(cur) + ' / ' + formatTime(dur)

    // 进度条
    if (dur > 0) {
      ctrlPlayed.style.width = (cur / dur * 100) + '%'
      ctrlLoaded.style.width = (audio.buffered.length > 0 ? audio.buffered.end(audio.buffered.length - 1) / dur * 100 : 0) + '%'
    }

    // 播放/暂停图标
    var icon = ctrlPlay.querySelector('i')
    if (audio.paused) {
      icon.className = 'fa-solid fa-play'
    } else {
      icon.className = 'fa-solid fa-pause'
    }

    // 音量图标
    var volIcon = ctrlVolBtn.querySelector('i')
    var vol = audio.volume
    if (vol === 0 || audio.muted) volIcon.className = 'fa-solid fa-volume-xmark'
    else if (vol < 0.5) volIcon.className = 'fa-solid fa-volume-low'
    else volIcon.className = 'fa-solid fa-volume-high'
  }

  /* ====== 歌词面板拖动 ====== */
  lrcBody.addEventListener('mousedown', function () { isDragging = true })
  lrcBody.addEventListener('touchstart', function () { isDragging = true }, { passive: true })
  document.addEventListener('mouseup', function () { isDragging = false })
  document.addEventListener('touchend', function () { isDragging = false })

  /* ====== 自定义控制栏事件 ====== */

  // 播放/暂停
  ctrlPlay.addEventListener('click', function () {
    if (!ap) return
    ap.toggle()
  })

  // 上一首（重新加载）
  ctrlPrev.addEventListener('click', function () {
    if (!ap || !ap.audio) return
    ap.audio.currentTime = 0
    ap.play()
  })

  // 下一首（换一首）
  ctrlNext.addEventListener('click', function () {
    loadSong()
  })

  // 进度条点击
  ctrlBar.addEventListener('click', function (e) {
    if (!ap || !ap.audio || !ap.audio.duration) return
    var rect = ctrlBar.getBoundingClientRect()
    var ratio = (e.clientX - rect.left) / rect.width
    ratio = Math.max(0, Math.min(1, ratio))
    ap.audio.currentTime = ratio * ap.audio.duration
  })

  // 音量按钮 - 静音切换
  ctrlVolBtn.addEventListener('click', function () {
    if (!ap || !ap.audio) return
    ap.audio.muted = !ap.audio.muted
    updateControls()
  })

  // 音量条点击
  ctrlVolBar.addEventListener('click', function (e) {
    if (!ap || !ap.audio) return
    var rect = ctrlVolBar.getBoundingClientRect()
    var ratio = (e.clientX - rect.left) / rect.width
    ratio = Math.max(0, Math.min(1, ratio))
    ap.audio.volume = ratio
    ap.audio.muted = false
    ctrlVolFill.style.width = (ratio * 100) + '%'
    updateControls()
  })

  /* ====== 加载歌曲 ====== */
  function loadSong() {
    wrap.innerHTML = '<div class="music-loading"><iconify-icon icon="ep:headset" class="ep-icon"></iconify-icon> 加载中...</div>'
    lrcBody.innerHTML = '<div class="music-lrc-empty">加载中...</div>'
    lrcData = []
    currentLine = -1
    ctrlTime.textContent = '0:00 / 0:00'
    ctrlPlayed.style.width = '0'
    ctrlLoaded.style.width = '0'
    ctrlSong.textContent = '--'
    infoName.textContent = '--'
    infoArtist.textContent = '--'
    infoAlbum.textContent = '--'

    fetch(API)
      .then(function (r) { return r.json() })
      .then(function (list) {
        if (!list || !list.length) throw new Error('empty')
        var song = list[Math.floor(Math.random() * list.length)]

        return fetch(song.lrc)
          .then(function (r) { return r.text() })
          .then(function (lrcText) {
            song.lrcText = lrcText
            return song
          })
          .catch(function () {
            song.lrcText = ''
            return song
          })
      })
      .then(function (song) {
        if (ap) { ap.destroy(); ap = null }
        wrap.innerHTML = ''

        // 渲染歌词
        renderLrc(parseLrc(song.lrcText))

        // 更新歌曲信息
        ctrlSong.textContent = song.name
        infoName.textContent = song.name
        infoArtist.textContent = song.artist || '未知歌手'
        infoAlbum.textContent = (song.album ? song.album + ' · ' : '') + (song.year || '')

        // 初始化 APlayer（隐藏控件，仅用于音频播放）
        ap = new APlayer({
          container: wrap,
          lrcType: 0,
          autoplay: false,
          theme: '#49B1F5',
          audio: [{
            name: song.name,
            artist: song.artist,
            url: song.url,
            cover: song.pic
          }]
        })

        // 初始化音量条
        if (ap.audio) {
          ctrlVolFill.style.width = (ap.audio.volume * 100) + '%'
        }

        // 时间更新 - 同步歌词 + 控制栏
        ap.on('timeupdate', function () {
          if (ap && ap.audio) {
            updateLrc(ap.audio.currentTime)
            updateControls()
          }
        })

        // 播放/暂停状态
        ap.on('play', function () { updateControls() })
        ap.on('pause', function () { updateControls() })

        // 播放结束
        ap.on('ended', function () {
          currentLine = -1
          var lines = lrcBody.querySelectorAll('.music-lrc-line')
          lines.forEach(function (el) { el.classList.remove('lrc-active') })
          if (lrcBody.scrollHeight > lrcBody.clientHeight) {
            lrcBody.scrollTo({ top: 0, behavior: 'smooth' })
          }
          updateControls()
        })

        // 加载完成更新时长
        ap.on('loadeddata', function () {
          updateControls()
        })

        updateControls()
      })
      .catch(function () {
        wrap.innerHTML = '<div class="music-loading"><iconify-icon icon="ep:headset" class="ep-icon"></iconify-icon> 加载失败，请刷新重试</div>'
        lrcBody.innerHTML = '<div class="music-lrc-empty">加载失败</div>'
      })
  }

  refreshBtn.addEventListener('click', loadSong)
  loadSong()
})()
