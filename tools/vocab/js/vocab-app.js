(function () {
  'use strict'

  /* ==========================================
     常量
     ========================================== */
  var STORAGE_KEY = 'vocab_app_data'
  var STORAGE_KEY_BOOK = 'vocab_current_book'
  var DEFAULT_INTERVALS = [1, 2, 4, 7, 15, 30]
  var DEFAULT_DAILY_COUNT = 20

  // 词库注册表（扩展新词库只需在这里添加）
  var BOOK_REGISTRY = [
    {
      id: 'cet4',
      name: 'CET-4 四级核心词汇',
      icon: '📗',
      desc: '大学英语四级·核心词',
      shuffle: true,
      files: [
        'data/四级核心词汇/CET4luan_1.json',
        'data/四级核心词汇/CET4luan_2.json'
      ]
    },
    {
      id: 'cet4-full',
      name: 'CET-4 四级全词汇',
      icon: '📘',
      desc: '大学英语四级·全词汇',
      shuffle: true,
      files: [
        'data/四级全词汇/CET4_1.json',
        'data/四级全词汇/CET4_2.json',
        'data/四级全词汇/CET4_3.json'
      ]
    },
    {
      id: 'cet6',
      name: 'CET-6 六级核心词汇',
      icon: '📙',
      desc: '大学英语六级',
      shuffle: true,
      files: [
        'data/六级单词/CET6_1.json',
        'data/六级单词/CET6_2.json',
        'data/六级单词/CET6_3.json'
      ]
    }
    // 后续扩展示例：
    // {
    //   id: 'kaoyan',
    //   name: '考研词汇',
    //   icon: '📕',
    //   desc: '研究生入学考试',
    //   shuffle: false,
    //   files: ['data/考研单词/kaoyan.json']
    // }
  ]

  /* ==========================================
     全局状态
     ========================================== */
  var allWords = []           // 所有单词的扁平化数组
  var appData = null          // 学习进度数据
  var currentBook = null      // 当前选中的词库
  var currentLearnWords = []  // 当前学习队列
  var currentLearnIndex = 0
  var currentReviewWords = [] // 当前艾宾浩斯复习队列
  var currentReviewIndex = 0
  var currentTodayWords = []  // 今日单词队列
  var currentTodayIndex = 0
  var currentReviewTab = 'today'     // 当前复习选项卡: 'today' | 'ebbinghaus'
  var currentTodayMode = 'review'    // 当前模式: 'review' | 'spell'
  var spellWrongCount = 0       // 拼写错误次数
  var spellShowAnswer = false   // 是否已显示正确答案
  var wordsReady = false      // 第一批词库是否就绪（可开始学习）
  var allWordsLoaded = false  // 全部词库是否加载完毕
  var totalFileCount = 0      // 词库文件总数
  var loadedFileCount = 0     // 已加载文件数

  /* ==========================================
     DOM 引用缓存
     ========================================== */
  var $ = function (id) { return document.getElementById(id) }

  /* ==========================================
     数据加载：从 JSON 解析单词
     ========================================== */
  function parseWordItem(item) {
    try {
      // --- CET6 格式（扁平结构） ---
      if (item.word && item.translations) {
        var meaning = ''
        var pos = ''
        if (item.translations && item.translations.length) {
          meaning = item.translations[0].translation || ''
          pos = item.translations[0].type || ''
        }
        var sentence = ''
        var sentenceCn = ''
        if (item.sentences && item.sentences.length) {
          sentence = item.sentences[0].sentence || ''
          sentenceCn = item.sentences[0].translation || ''
        }
        var phrases = []
        if (item.phrases && item.phrases.length) {
          item.phrases.forEach(function (p) {
            if (p.phrase) {
              phrases.push({ en: p.phrase, cn: p.translation || '' })
            }
          })
        }
        return {
          word: item.word,
          phonetic: [item.us, item.uk].filter(Boolean).join(' / '),
          meaning: meaning,
          pos: pos,
          sentence: sentence,
          sentenceCn: sentenceCn,
          mnemonic: '',
          synos: [],
          phrases: phrases
        }
      }

      // --- CET4 格式（嵌套结构） ---
      var w = item.content.word.content
      var word = item.headWord || ''
      var phone = w.usphone || w.phone || ''
      var ukphone = w.ukphone || ''

      // 释义
      var trans = w.trans
      var meaning = ''
      var pos = ''
      if (trans && trans.length) {
        meaning = trans[0].tranCn || ''
        pos = trans[0].pos || ''
      }

      // 例句
      var sentence = ''
      var sentenceCn = ''
      if (w.sentence && w.sentence.sentences && w.sentence.sentences.length) {
        sentence = w.sentence.sentences[0].sContent || ''
        sentenceCn = w.sentence.sentences[0].sCn || ''
      }

      // 记忆技巧
      var mnemonic = ''
      if (w.remMethod && w.remMethod.val) {
        mnemonic = w.remMethod.val
      }

      // 同近义词
      var synos = []
      if (w.syno && w.syno.synos) {
        w.syno.synos.forEach(function (s) {
          if (s.hwds) {
            s.hwds.forEach(function (h) {
              if (h.w) synos.push(h.w)
            })
          }
        })
      }

      // 短语
      var phrases = []
      if (w.phrase && w.phrase.phrases) {
        w.phrase.phrases.forEach(function (p) {
          if (p.pContent) {
            phrases.push({ en: p.pContent, cn: p.pCn || '' })
          }
        })
      }

      return {
        word: word,
        phonetic: [phone, ukphone].filter(Boolean).join(' / '),
        meaning: meaning,
        pos: pos,
        sentence: sentence,
        sentenceCn: sentenceCn,
        mnemonic: mnemonic,
        synos: synos,
        phrases: phrases
      }
    } catch (e) {
      return null
    }
  }

  function loadWordData() {
    if (allWordsLoaded) return Promise.resolve()
    allWords = []
    wordsReady = false
    allWordsLoaded = false
    loadedFileCount = 0

    var files = currentBook ? currentBook.files : []
    totalFileCount = files.length
    if (!files.length) {
      showToast('词库未配置数据文件', 'error')
      return Promise.resolve()
    }

    // 更新加载进度
    updateLoadProgress()

    // 顺序加载：先加载第一个文件让 app 尽快可用，其余后台加载
    function loadNext(index) {
      if (index >= files.length) {
        allWordsLoaded = true
        wordsReady = true
        updateLoadProgress()
        hideLoadProgress()
        console.log('All ' + allWords.length + ' words loaded from ' + currentBook.name)
        updateBadges()
        updateBookInfo()
        return Promise.resolve()
      }

      var file = files[index]
      updateLoadProgress(index + 1)

      return fetch(file)
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status)
          return res.json()
        })
        .then(function (data) {
          var words = []
          data.forEach(function (item) {
            var parsed = parseWordItem(item)
            if (parsed && parsed.word && parsed.meaning) {
              words.push(parsed)
            }
          })
          allWords = allWords.concat(words)
          loadedFileCount = index + 1
          updateLoadProgress(index + 1)

          // 第一个文件加载完 → 标记为可用
          if (index === 0) {
            wordsReady = true
            updateBadges()
            updateBookInfo()
            updateLoadProgress(1, true)
          }

          console.log('Loaded ' + file + ' (' + words.length + ' words), total: ' + allWords.length)
          return loadNext(index + 1)
        })
        .catch(function (err) {
          console.warn('Failed to load:', file, err)
          loadedFileCount = index + 1
          // 跳过失败的文件，继续加载下一个
          return loadNext(index + 1)
        })
    }

    return loadNext(0)
  }

  // 加载进度更新
  function updateLoadProgress(current, isFirstReady) {
    var loader = document.getElementById('loadOverlay')
    if (!loader) return

    var bar = document.getElementById('loadBar')
    var text = document.getElementById('loadText')
    var detail = document.getElementById('loadDetail')

    if (isFirstReady && wordsReady && !allWordsLoaded) {
      // 第一批就绪，后台继续加载
      if (text) text.textContent = '✅ 词库就绪，可以开始学习了'
      if (detail) detail.textContent = '后台加载剩余词库中... (' + loadedFileCount + '/' + totalFileCount + ')'
      if (bar) bar.style.width = (loadedFileCount / totalFileCount * 100) + '%'
      // 1.5秒后自动隐藏
      setTimeout(function () {
        if (wordsReady && !allWordsLoaded) {
          hideLoadProgress()
        }
      }, 1500)
      return
    }

    if (text) text.textContent = '正在加载词库...'
    if (detail) detail.textContent = '加载第 ' + (current || 1) + '/' + totalFileCount + ' 个文件'
    if (bar) bar.style.width = ((current || 1) / totalFileCount * 100) + '%'
  }

  function hideLoadProgress() {
    var loader = document.getElementById('loadOverlay')
    if (loader) {
      loader.style.opacity = '0'
      setTimeout(function () {
        if (loader.parentNode) {
          loader.style.display = 'none'
        }
      }, 400)
    }
  }

  /* ==========================================
     localStorage 数据管理
     ========================================== */
  function loadAppData() {
    var raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        appData = JSON.parse(raw)
      } catch (e) {
        appData = null
      }
    }
    if (!appData) {
      appData = {
        progress: {},       // { wordIndex: { learnedAt, reviewCount, nextReview, stage, status } }
        dailyLog: {},       // { "YYYY-MM-DD": { newWords: N, reviewed: N } }
        settings: {
          dailyCount: DEFAULT_DAILY_COUNT,
          intervals: DEFAULT_INTERVALS.slice()
        },
        lastActiveDate: '',
        currentSession: null  // { date, learnWords: [], learnIndex: 0 }
      }
    }
    // 兼容旧数据
    if (!appData.dailyLog) appData.dailyLog = {}
    if (!appData.settings) appData.settings = { dailyCount: DEFAULT_DAILY_COUNT, intervals: DEFAULT_INTERVALS.slice() }
    if (!appData.settings.intervals) appData.settings.intervals = DEFAULT_INTERVALS.slice()
    if (!appData.currentSession) appData.currentSession = null

    // 清理过期的学习会话（非今天）
    var today = getToday()
    if (appData.currentSession && appData.currentSession.date !== today) {
      appData.currentSession = null
    }
  }

  function saveAppData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData))
  }

  /* ==========================================
     词库选择
     ========================================== */
  function getCurrentBook() {
    if (currentBook) return currentBook
    var savedId = localStorage.getItem(STORAGE_KEY_BOOK)
    // 迁移旧 ID
    if (savedId === 'cet4-random') {
      savedId = 'cet4-full'
      localStorage.setItem(STORAGE_KEY_BOOK, savedId)
    }
    return findBookById(savedId) || BOOK_REGISTRY[0]
  }

  function findBookById(id) {
    for (var i = 0; i < BOOK_REGISTRY.length; i++) {
      if (BOOK_REGISTRY[i].id === id) return BOOK_REGISTRY[i]
    }
    return null
  }

  function switchBook(bookId) {
    var book = findBookById(bookId)
    if (!book || (currentBook && currentBook.id === bookId)) return

    currentBook = book
    localStorage.setItem(STORAGE_KEY_BOOK, bookId)
    wordsReady = false
    allWordsLoaded = false
    allWords = []
    appData.currentSession = null  // 切换词库时清除旧会话
    saveAppData()

    renderBooksPage()
    updateBookInfo()
    resetLearnUI()
    resetReviewUI()

    // 显示加载进度层
    var loader = document.getElementById('loadOverlay')
    if (loader) {
      loader.style.display = 'flex'
      loader.style.opacity = '1'
    }
    updateLoadProgress(0)

    loadWordData().then(function () {
      if (allWordsLoaded) {
        showToast('「' + book.name + '」全部加载完成！共 ' + allWords.length + ' 个单词', 'success')
      }
    }).catch(function () {
      showToast('词库加载失败', 'error')
    })
  }

  function renderBooksPage() {
    var grid = document.getElementById('bookGrid')
    if (!grid) return
    var html = ''
    for (var i = 0; i < BOOK_REGISTRY.length; i++) {
      var book = BOOK_REGISTRY[i]
      var isActive = currentBook && currentBook.id === book.id
      html += '<div class="book-card' + (isActive ? ' active' : '') + '" data-book-id="' + book.id + '">' +
        '<div class="book-card-icon">' + book.icon + '</div>' +
        '<div class="book-card-name">' + book.name + '</div>' +
        '<div class="book-card-desc">' + book.desc + '</div>' +
        '<span class="book-card-count">' + book.files.length + ' 个文件</span>' +
        '</div>'
    }
    grid.innerHTML = html

    var cards = grid.querySelectorAll('.book-card')
    for (var j = 0; j < cards.length; j++) {
      cards[j].addEventListener('click', function () {
        var bookId = this.getAttribute('data-book-id')
        if (bookId) switchBook(bookId)
      })
    }
  }

  function updateBookInfo() {
    var bookInfo = document.getElementById('bookInfo')
    if (bookInfo && currentBook) {
      bookInfo.textContent = '词库：' + currentBook.name
    }
    var progressInfo = document.getElementById('progressInfo')
    if (progressInfo) {
      var totalLearned = Object.keys(appData.progress).length
      progressInfo.textContent = '已学：' + totalLearned + ' / ' + allWords.length
    }
  }

  function resetLearnUI() {
    var learnEmpty = document.getElementById('learnEmpty')
    var learnCard = document.getElementById('learnCard')
    var learnComplete = document.getElementById('learnComplete')
    if (learnEmpty) learnEmpty.style.display = 'block'
    if (learnCard) learnCard.style.display = 'none'
    if (learnComplete) learnComplete.style.display = 'none'
    currentLearnWords = []
    currentLearnIndex = 0
  }

  function resetReviewUI() {
    var reviewEmpty = document.getElementById('reviewEmpty')
    var reviewCard = document.getElementById('reviewCard')
    var reviewComplete = document.getElementById('reviewComplete')
    if (reviewEmpty) reviewEmpty.style.display = 'block'
    if (reviewCard) reviewCard.style.display = 'none'
    if (reviewComplete) reviewComplete.style.display = 'none'
    currentReviewWords = []
    currentReviewIndex = 0
  }

  function getToday() {
    var d = new Date()
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
  }

  function addDays(dateStr, days) {
    var d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
  }

  /* ==========================================
     艾宾浩斯遗忘曲线算法
     ========================================== */
  function getNextReviewDate(learnedAt, reviewCount) {
    var intervals = appData.settings.intervals
    if (reviewCount >= intervals.length) {
      return null  // 已掌握，不再需要复习
    }
    var days = intervals[reviewCount]
    return addDays(learnedAt, days)
  }

  function getWordsForReview(dateStr) {
    var result = []
    var allIndices = Object.keys(appData.progress)
    for (var i = 0; i < allIndices.length; i++) {
      var idx = allIndices[i]
      var p = appData.progress[idx]
      if (p.nextReview === dateStr && p.status === 'reviewing') {
        result.push(parseInt(idx))
      }
    }
    return result
  }

  function getNewWordsToLearn() {
    var today = getToday()
    var learned = Object.keys(appData.progress).map(Number)
    var available = []
    for (var i = 0; i < allWords.length; i++) {
      if (learned.indexOf(i) === -1) {
        available.push(i)
      }
    }
    // 根据词库设置决定是否随机打乱
    if (currentBook && currentBook.shuffle) {
      shuffleArray(available)
    }
    // 顺序模式：直接按 allWords 原始顺序取
    return available.slice(0, appData.settings.dailyCount)
  }

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
    }
  }

  function markWordLearned(wordIndex) {
    var today = getToday()
    var isNew = !appData.progress[wordIndex]
    if (isNew) {
      appData.progress[wordIndex] = {
        learnedAt: today,
        reviewCount: 0,
        nextReview: addDays(today, appData.settings.intervals[0]),
        stage: 0,
        status: 'reviewing'
      }
      if (!appData.dailyLog[today]) {
        appData.dailyLog[today] = { newWords: 0, reviewed: 0, words: [] }
      }
      if (!appData.dailyLog[today].words) {
        appData.dailyLog[today].words = []
      }
      appData.dailyLog[today].newWords++
      appData.dailyLog[today].words.push(wordIndex)
    }
    appData.lastActiveDate = today
    saveAppData()
  }

  function markWordReviewed(wordIndex, remembered) {
    var today = getToday()
    var p = appData.progress[wordIndex]
    if (!p) return

    if (remembered) {
      p.reviewCount++
      var nextReview = getNextReviewDate(p.learnedAt, p.reviewCount)
      if (nextReview) {
        p.nextReview = nextReview
        p.stage = p.reviewCount
        p.status = 'reviewing'
      } else {
        p.nextReview = null
        p.status = 'mastered'
      }
    } else {
      // 忘记了，重置到第一阶段
      p.reviewCount = 0
      p.nextReview = addDays(today, appData.settings.intervals[0])
      p.stage = 0
      p.status = 'reviewing'
    }

    if (!appData.dailyLog[today]) {
      appData.dailyLog[today] = { newWords: 0, reviewed: 0 }
    }
    appData.dailyLog[today].reviewed++
    appData.lastActiveDate = today
    saveAppData()
  }

  /* ==========================================
     统计计算
     ========================================== */
  function getStats() {
    var total = Object.keys(appData.progress).length
    var mastered = 0
    var reviewing = 0
    var stageCounts = {}

    Object.keys(appData.progress).forEach(function (idx) {
      var p = appData.progress[idx]
      if (p.status === 'mastered') {
        mastered++
      } else {
        reviewing++
      }
      var stage = '第' + (p.reviewCount + 1) + '轮'
      stageCounts[stage] = (stageCounts[stage] || 0) + 1
    })

    // 连续打卡天数
    var streak = 0
    var today = getToday()
    var d = new Date(today)
    while (true) {
      var dateStr = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0')
      if (appData.dailyLog[dateStr] && (appData.dailyLog[dateStr].newWords > 0 || appData.dailyLog[dateStr].reviewed > 0)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }

    return {
      total: total,
      mastered: mastered,
      reviewing: reviewing,
      streak: streak,
      stageCounts: stageCounts
    }
  }

  function getWeekData() {
    var result = []
    var today = new Date()
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today)
      d.setDate(d.getDate() - i)
      var dateStr = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0')
      var dayNames = ['日', '一', '二', '三', '四', '五', '六']
      var log = appData.dailyLog[dateStr] || { newWords: 0, reviewed: 0 }
      result.push({
        date: dateStr,
        label: dayNames[d.getDay()],
        newWords: log.newWords || 0,
        reviewed: log.reviewed || 0,
        total: (log.newWords || 0) + (log.reviewed || 0),
        isToday: i === 0
      })
    }
    return result
  }

  /* ==========================================
     侧边栏导航
     ========================================== */
  function initNavigation() {
    var navItems = document.querySelectorAll('.nav-item')
    navItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault()
        var page = this.getAttribute('data-page')
        switchPage(page)
      })
    })
  }

  function switchPage(page) {
    // 更新导航
    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('data-page') === page)
    })
    // 更新内容
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.remove('active')
    })
    var targetPage = $('page-' + page)
    if (targetPage) targetPage.classList.add('active')

    // 根据页面刷新数据
    if (page === 'stats') renderStats()
    if (page === 'settings') renderSettings()
    if (page === 'books') renderBooksPage()
    if (page === 'learn') {
      var today = getToday()
      // 今日已完成或会话完成 → 显示完成页
      if (appData.dailyLog[today] && (appData.dailyLog[today].completed || appData.dailyLog[today].sessionDone)) {
        startLearning()
      } else if (appData.currentSession && appData.currentSession.date === today &&
          appData.currentSession.learnWords.length > 0 &&
          appData.currentSession.learnIndex < appData.currentSession.learnWords.length) {
        startLearning()
      }
    }
    if (page === 'review') switchReviewTab(currentReviewTab)
    updateBadges()
  }

  /* ==========================================
     徽章更新
     ========================================== */
  function updateBadges() {
    var today = getToday()
    var newCount = 0

    // 今日学习已完成 → 显示 0
    if (appData.dailyLog[today] && appData.dailyLog[today].completed) {
      newCount = 0
    } else if (appData.currentSession && appData.currentSession.date === today && appData.currentSession.learnWords.length > 0) {
      // 活跃会话：剩余单词数
      newCount = Math.max(0, appData.currentSession.learnWords.length - appData.currentSession.learnIndex)
    } else {
      // 无会话：每日预设数量
      newCount = appData.settings.dailyCount
    }

    var reviewIndices = getWordsForReview(today)
    var reviewCount = reviewIndices.length

    var newBadge = $('newWordBadge')
    var reviewBadge = $('reviewBadge')
    if (newBadge) newBadge.textContent = newCount
    if (reviewBadge) reviewBadge.textContent = reviewCount

    // 进度信息
    updateBookInfo()
  }

  /* ==========================================
     学习新词页面
     ========================================== */
  function initLearnPage() {
    var btnStart = $('btnStartLearn')
    var btnRemember = $('btnRemember')
    var btnForgot = $('btnForgot')
    var btnBack = $('btnBackToLearn')
    var btnContinue = $('btnContinueLearn')
    var btnSpeaker = $('btnSpeaker')
    var btnPrev = $('btnPrevWord')
    var btnNext = $('btnNextWord')

    if (btnStart) btnStart.addEventListener('click', startLearning)
    if (btnRemember) btnRemember.addEventListener('click', function () { handleLearnAnswer(true) })
    if (btnForgot) btnForgot.addEventListener('click', function () { handleLearnAnswer(false) })
    if (btnBack) btnBack.addEventListener('click', finishLearning)
    if (btnContinue) btnContinue.addEventListener('click', continueLearning)
    var btnLearnToReview = $('btnLearnToReview')
    if (btnLearnToReview) btnLearnToReview.addEventListener('click', function () {
      switchPage('review')
    })
    if (btnSpeaker) btnSpeaker.addEventListener('click', function () { speakWord(currentLearnWords[currentLearnIndex]) })
    if (btnPrev) btnPrev.addEventListener('click', goToPrevWord)
    if (btnNext) btnNext.addEventListener('click', goToNextWord)
  }

  function startLearning() {
    var today = getToday()

    // 今日已完成 → 直接显示完成页（无需词库数据）
    if (appData.dailyLog[today] && (appData.dailyLog[today].completed || appData.dailyLog[today].sessionDone)) {
      showLearnComplete()
      return
    }

    if (!wordsReady) {
      showToast('词库正在加载中，请稍候...', 'error')
      return
    }

    // 检查是否有今天的学习会话，有则恢复
    var hasSession = appData.currentSession && appData.currentSession.date === today && appData.currentSession.learnWords.length > 0
    if (hasSession && appData.currentSession.learnIndex < appData.currentSession.learnWords.length) {
      // 恢复未完成的会话
      currentLearnWords = appData.currentSession.learnWords
      currentLearnIndex = appData.currentSession.learnIndex
    } else {
      // 会话已完成或不存在，生成新的学习队列
      if (hasSession) {
        appData.currentSession = null
        saveAppData()
      }
      var newWords = getNewWordsToLearn()
      if (newWords.length === 0) {
        showToast('今日新词已学完，去看看复习吧！', 'success')
        return
      }
      currentLearnWords = newWords
      currentLearnIndex = 0
      appData.currentSession = {
        date: today,
        learnWords: newWords.slice(),
        learnIndex: 0
      }
      saveAppData()
    }

    $('learnEmpty').style.display = 'none'
    $('learnCard').style.display = 'block'
    $('learnComplete').style.display = 'none'
    showLearnWord()
  }

  function showLearnWord() {
    if (currentLearnIndex >= currentLearnWords.length) {
      showLearnComplete()
      return
    }

    var idx = currentLearnWords[currentLearnIndex]
    var word = allWords[idx]
    if (!word) {
      currentLearnIndex++
      showLearnWord()
      return
    }

    // 更新进度
    updateBadges()
    $('cardProgress').textContent = '第 ' + (currentLearnIndex + 1) + '/' + currentLearnWords.length + ' 个'
    $('progressFill').style.width = ((currentLearnIndex) / currentLearnWords.length * 100) + '%'
    $('cardBadge').textContent = '新词'
    $('cardBadge').className = 'card-badge'

    // 填充内容
    $('cardWord').textContent = word.word
    $('cardPhonetic').textContent = word.phonetic || '-'
    $('cardMeaning').textContent = (word.pos ? word.pos + '. ' : '') + word.meaning

    $('cardSentence').textContent = word.sentence || '-'
    $('cardSentenceCn').textContent = word.sentenceCn || ''

    if (word.mnemonic) {
      $('cardMnemonicSection').style.display = 'block'
      $('cardMnemonic').textContent = word.mnemonic
    } else {
      $('cardMnemonicSection').style.display = 'none'
    }

    if (word.synos && word.synos.length) {
      $('cardSynoSection').style.display = 'block'
      $('cardSyno').textContent = word.synos.join('、')
    } else {
      $('cardSynoSection').style.display = 'none'
    }

    if (word.phrases && word.phrases.length) {
      $('cardPhraseSection').style.display = 'block'
      var phraseHTML = word.phrases.map(function (p) {
        return '<span class="card-phrase-item">' + p.en + ' ' + p.cn + '</span>'
      }).join('')
      $('cardPhrase').innerHTML = phraseHTML
    } else {
      $('cardPhraseSection').style.display = 'none'
    }

    // 重新动画
    var card = $('learnCard')
    card.style.animation = 'none'
    card.offsetHeight
    card.style.animation = 'fadeInUp .3s ease'
    updateNavButtons()
    // 自动播放单词读音
    speakWord(idx)
  }

  function handleLearnAnswer(remembered) {
    var idx = currentLearnWords[currentLearnIndex]
    if (remembered) {
      markWordLearned(idx)
    } else {
      // 没记住：也标记为已学，但立即加入今日复习队列
      markWordLearned(idx)
      markWordReviewed(idx, false)
      // 覆盖为今天复习
      appData.progress[idx].nextReview = getToday()
    }
    currentLearnIndex++
    // 保存会话进度
    if (appData.currentSession) {
      appData.currentSession.learnIndex = currentLearnIndex
    }
    saveAppData()
    showLearnWord()
  }

  function showLearnComplete() {
    $('learnEmpty').style.display = 'none'
    $('learnCard').style.display = 'none'
    $('learnComplete').style.display = 'block'
    var today = getToday()
    var learned = appData.dailyLog[today] ? (appData.dailyLog[today].newWords || 0) : 0
    $('completeSummary').textContent = '今天共学习了 ' + learned + ' 个新单词' + (learned >= appData.settings.dailyCount ? '，已达每日目标！' : '')
    // 标记本轮会话已完成，刷新后不再自动推新词
    if (!appData.dailyLog[today]) {
      appData.dailyLog[today] = { newWords: 0, reviewed: 0, words: [] }
    }
    appData.dailyLog[today].sessionDone = true
    appData.currentSession = null
    saveAppData()
    updateBadges()
  }

  function finishLearning() {
    var today = getToday()
    if (!appData.dailyLog[today]) {
      appData.dailyLog[today] = { newWords: 0, reviewed: 0, words: [] }
    }
    appData.dailyLog[today].completed = true
    saveAppData()
    resetLearnUI()
    updateBadges()
  }

  function restoreLearnPage() {
    var today = getToday()
    if (appData.dailyLog[today] && (appData.dailyLog[today].completed || appData.dailyLog[today].sessionDone)) {
      showLearnComplete()
    }
  }

  function continueLearning() {
    var today = getToday()
    if (!appData.dailyLog[today]) {
      appData.dailyLog[today] = { newWords: 0, reviewed: 0, words: [] }
    }
    // 清除标记，允许继续学
    appData.dailyLog[today].completed = false
    appData.dailyLog[today].sessionDone = false
    // 生成新一批单词
    var newWords = getNewWordsToLearn()
    if (newWords.length === 0) {
      showToast('词库中所有单词都已学完，太厉害了！', 'success')
      appData.dailyLog[today].completed = true
      saveAppData()
      resetLearnUI()
      updateBadges()
      return
    }
    // 创建新会话
    appData.currentSession = {
      date: today,
      learnWords: newWords,
      learnIndex: 0
    }
    currentLearnWords = newWords
    currentLearnIndex = 0
    saveAppData()
    $('learnComplete').style.display = 'none'
    $('learnCard').style.display = 'block'
    updateBadges()
    showLearnWord()
  }

  function goToPrevWord() {
    if (currentLearnIndex > 0) {
      currentLearnIndex--
      // 保存会话进度
      if (appData.currentSession) {
        appData.currentSession.learnIndex = currentLearnIndex
      }
      saveAppData()
      showLearnWord()
    }
  }

  function goToNextWord() {
    if (currentLearnIndex < currentLearnWords.length - 1) {
      currentLearnIndex++
      // 保存会话进度
      if (appData.currentSession) {
        appData.currentSession.learnIndex = currentLearnIndex
      }
      saveAppData()
      showLearnWord()
    }
  }

  function updateNavButtons() {
    var prevBtn = $('btnPrevWord')
    var nextBtn = $('btnNextWord')
    if (prevBtn) prevBtn.disabled = (currentLearnIndex <= 0)
    if (nextBtn) nextBtn.disabled = (currentLearnIndex >= currentLearnWords.length - 1)
  }

  /* ==========================================
     复习页面 - 初始化
     ========================================== */
  function initReviewPage() {
    // 艾宾浩斯复习
    var btnShowMeaning = $('btnShowMeaning')
    var btnReviewRemember = $('btnReviewRemember')
    var btnReviewForgot = $('btnReviewForgot')
    var btnReviewSpeaker = $('btnReviewSpeaker')
    var btnBackReview = $('btnBackToReview')

    if (btnShowMeaning) btnShowMeaning.addEventListener('click', showMeaning)
    if (btnReviewRemember) btnReviewRemember.addEventListener('click', function () { handleReviewAnswer(true) })
    if (btnReviewForgot) btnReviewForgot.addEventListener('click', function () { handleReviewAnswer(false) })
    if (btnReviewSpeaker) btnReviewSpeaker.addEventListener('click', function () { speakWord(currentReviewWords[currentReviewIndex]) })
    if (btnBackReview) btnBackReview.addEventListener('click', function () {
      $('reviewEmpty').style.display = 'block'
      $('reviewCard').style.display = 'none'
      $('reviewComplete').style.display = 'none'
      updateBadges()
    })

    // 今日单词
    var btnTodaySpeaker = $('btnTodaySpeaker')
    var btnTodayShowMeaning = $('btnTodayShowMeaning')
    var btnTodayRemember = $('btnTodayRemember')
    var btnTodayForgot = $('btnTodayForgot')
    var btnTodayPrev = $('btnTodayPrev')
    var btnTodayNext = $('btnTodayNext')
    var btnBackToToday = $('btnBackToToday')
    var btnSpellCheck = $('btnSpellCheck')

    if (btnTodayShowMeaning) btnTodayShowMeaning.addEventListener('click', showTodayMeaning)
    if (btnTodayRemember) btnTodayRemember.addEventListener('click', function () { handleTodayAnswer(true) })
    if (btnTodayForgot) btnTodayForgot.addEventListener('click', function () { handleTodayAnswer(false) })
    if (btnTodayPrev) btnTodayPrev.addEventListener('click', goToPrevTodayWord)
    if (btnTodayNext) btnTodayNext.addEventListener('click', goToNextTodayWord)
    if (btnSpellCheck) btnSpellCheck.addEventListener('click', checkSpelling)
    var btnTogglePhonetic = $('btnTogglePhonetic')
    if (btnTogglePhonetic) btnTogglePhonetic.addEventListener('click', function () {
      var el = $('spellPhonetic')
      if (el.style.display === 'none') {
        el.style.display = ''
        btnTogglePhonetic.textContent = '🙈'
        btnTogglePhonetic.title = '隐藏音标'
      } else {
        el.style.display = 'none'
        btnTogglePhonetic.textContent = '👁️'
        btnTogglePhonetic.title = '显示音标'
      }
    })
    if (btnBackToToday) btnBackToToday.addEventListener('click', function () {
      $('todayEmpty').style.display = 'block'
      $('todayCard').style.display = 'none'
      $('todayComplete').style.display = 'none'
      updateBadges()
    })
    var btnContinueReview = $('btnContinueReview')
    if (btnContinueReview) btnContinueReview.addEventListener('click', function () {
      $('todayComplete').style.display = 'none'
      $('todayCard').style.display = 'block'
      currentTodayIndex = 0
      showTodayWord()
    })
    // 拼写输入框回车提交
    var spellInput = $('spellInput')
    if (spellInput) {
      spellInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') checkSpelling()
      })
    }

    // 选项卡切换
    var reviewTabs = document.querySelectorAll('.review-tab')
    reviewTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchReviewTab(this.getAttribute('data-tab'))
      })
    })

    // 模式切换
    var modeBtns = document.querySelectorAll('#panel-today .mode-btn')
    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTodayMode(this.getAttribute('data-mode'))
      })
    })

    // 页面切换时自动检测
    var observer = new MutationObserver(function () {
      if ($('page-review') && $('page-review').classList.contains('active')) {
        switchReviewTab(currentReviewTab)
      }
    })
    var reviewPage = $('page-review')
    if (reviewPage) {
      observer.observe(reviewPage, { attributes: true, attributeFilter: ['class'] })
    }
  }

  /* ==========================================
     复习页面 - 双选项卡
     ========================================== */

  function switchReviewTab(tab) {
    currentReviewTab = tab
    var tabs = document.querySelectorAll('.review-tab')
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tab)
    })
    var panels = document.querySelectorAll('.review-panel')
    panels.forEach(function (p) {
      p.classList.toggle('active', p.id === 'panel-' + tab)
    })
    if (tab === 'today') {
      loadTodayWords()
    } else if (tab === 'summary') {
      renderSummaryTable()
    } else {
      checkReviewQueue()
    }
  }

  function switchTodayMode(mode) {
    currentTodayMode = mode
    var modeBtns = document.querySelectorAll('#panel-today .mode-btn')
    modeBtns.forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode)
    })
    currentTodayIndex = 0
    showTodayWord()
  }

  /* ---------- 今日单词 ---------- */
  function loadTodayWords() {
    var today = getToday()
    var wordIndices = []

    if (appData.currentSession && appData.currentSession.date === today && appData.currentSession.learnWords.length > 0) {
      wordIndices = appData.currentSession.learnWords
    } else if (appData.dailyLog[today] && appData.dailyLog[today].words) {
      wordIndices = appData.dailyLog[today].words
    } else {
      wordIndices = getNewWordsToLearn()
      if (wordIndices.length === 0 && Object.keys(appData.progress).length > 0) {
        wordIndices = Object.keys(appData.progress).map(Number).slice(-20)
      }
    }

    currentTodayWords = wordIndices
    currentTodayIndex = 0

    if (wordIndices.length === 0) {
      $('todayEmpty').style.display = 'block'
      $('todayCard').style.display = 'none'
      $('todayComplete').style.display = 'none'
    } else {
      $('todayEmpty').style.display = 'none'
      $('todayCard').style.display = 'block'
      $('todayComplete').style.display = 'none'
      showTodayWord()
    }
  }

  function showTodayWord() {
    if (currentTodayIndex >= currentTodayWords.length) {
      showTodayComplete()
      return
    }

    $('todayCard').style.display = 'block'
    $('todayComplete').style.display = 'none'

    var idx = currentTodayWords[currentTodayIndex]
    var word = allWords[idx]
    if (!word) {
      currentTodayIndex++
      showTodayWord()
      return
    }

    if (currentTodayMode === 'review') {
      showTodayReviewMode(word)
    } else {
      showTodaySpellMode(word)
    }
  }

  function showTodayReviewMode(word) {
    $('todayReviewBody').style.display = 'flex'
    $('todaySpellBody').style.display = 'none'

    $('todayWord').textContent = word.word
    $('todayPhonetic').textContent = word.phonetic || '-'
    $('todayMeaning').textContent = (word.pos ? word.pos + '. ' : '') + word.meaning
    $('todayMeaning').style.display = 'none'
    $('btnTodayShowMeaning').style.display = 'inline-block'
    $('todaySentenceSection').style.display = 'none'
    $('todayMnemonicSection').style.display = 'none'

    updateTodayNavButtons()
    updatetodaySpeakerBtn()

    var card = $('todayCard')
    card.style.animation = 'none'
    card.offsetHeight
    card.style.animation = 'fadeInUp .3s ease'
    speakWord(currentTodayWords[currentTodayIndex])
  }

  function showTodaySpellMode(word) {
    $('todayReviewBody').style.display = 'none'
    $('todaySpellBody').style.display = 'flex'

    spellWrongCount = 0
    spellShowAnswer = false

    $('spellPhonetic').textContent = word.phonetic || ''
    $('spellPhonetic').style.display = 'none'
    $('spellMeaning').textContent = word.meaning
    $('spellInput').value = ''
    $('spellInput').className = 'spell-input'
    $('spellHint').textContent = ''
    $('spellFeedback').innerHTML = ''
    $('spellFeedback').className = 'spell-feedback'
    $('btnSpellCheck').textContent = '检查'
    $('btnSpellCheck').disabled = false
    $('spellInput').disabled = false
    $('spellInput').focus()

    updateTodayNavButtons()
    updatetodaySpeakerBtn()

    var card = $('todayCard')
    card.style.animation = 'none'
    card.offsetHeight
    card.style.animation = 'fadeInUp .3s ease'
  }

  function updatetodaySpeakerBtn() {
    $('btnTodaySpeaker').onclick = function () {
      var idx = currentTodayWords[currentTodayIndex]
      var word = allWords[idx]
      if (word) speakWord(idx)
    }
  }

  function showTodayMeaning() {
    var idx = currentTodayWords[currentTodayIndex]
    var word = allWords[idx]
    if (!word) return
    $('todayMeaning').style.display = 'block'
    $('btnTodayShowMeaning').style.display = 'none'
    if (word.sentence) {
      $('todaySentenceSection').style.display = 'block'
      $('todaySentence').textContent = word.sentence
      $('todaySentenceCn').textContent = word.sentenceCn || ''
    }
    if (word.mnemonic) {
      $('todayMnemonicSection').style.display = 'block'
      $('todayMnemonic').textContent = word.mnemonic
    }
  }

  function checkSpelling() {
    var idx = currentTodayWords[currentTodayIndex]
    var word = allWords[idx]
    if (!word) return

    var input = $('spellInput')
    var userAnswer = input.value.trim()
    var correctWord = word.word

    if (!userAnswer) {
      input.focus()
      return
    }

    var normalized = userAnswer.replace(/\s+/g, '').toLowerCase()
    var correct = correctWord.replace(/\s+/g, '').toLowerCase()

    if (normalized === correct) {
      input.className = 'spell-input correct'
      $('spellFeedback').innerHTML = '✅ <b>正确！</b> ' + correctWord
      $('spellFeedback').className = 'spell-feedback correct'
      $('btnSpellCheck').textContent = '✓'
      $('btnSpellCheck').disabled = true
      $('spellInput').disabled = true
      if (!appData.progress[idx]) markWordLearned(idx)
      markWordReviewed(idx, true)
      setTimeout(function () {
        if (currentTodayIndex < currentTodayWords.length) {
          goToNextTodayWord()
        }
      }, 1500)
    } else {
      input.className = 'spell-input wrong'
      spellWrongCount++
      if (spellWrongCount >= 2) {
        $('spellFeedback').innerHTML = '❌ 正确答案是：<b>' + correctWord + '</b>，请拼写正确后继续'
        $('spellFeedback').className = 'spell-feedback wrong'
        $('spellHint').textContent = ''
        spellShowAnswer = true
        input.className = 'spell-input'
        input.value = ''
        input.disabled = false
        input.focus()
        $('btnSpellCheck').textContent = '检查'
        $('btnSpellCheck').disabled = false
        if (!appData.progress[idx]) markWordLearned(idx)
        markWordReviewed(idx, false)
      } else {
        $('spellFeedback').innerHTML = '❌ 不对哦，再试一次！'
        $('spellFeedback').className = 'spell-feedback wrong'
        $('spellHint').textContent = '💡 提示：首字母是 "' + correctWord.charAt(0) + '"，共 ' + correctWord.length + ' 个字母'
        if (!appData.progress[idx]) markWordLearned(idx)
        markWordReviewed(idx, false)
        setTimeout(function () {
          input.className = 'spell-input'
          input.value = ''
          input.focus()
          $('btnSpellCheck').textContent = '检查'
          $('spellFeedback').innerHTML = ''
          $('spellFeedback').className = 'spell-feedback'
        }, 1500)
      }
    }
  }

  function handleTodayAnswer(remembered) {
    var idx = currentTodayWords[currentTodayIndex]
    if (remembered) {
      if (!appData.progress[idx]) {
        markWordLearned(idx)
      }
      markWordReviewed(idx, true)
    }
    currentTodayIndex++
    showTodayWord()
  }

  function goToPrevTodayWord() {
    if (currentTodayIndex > 0) {
      currentTodayIndex--
      showTodayWord()
    }
  }

  function goToNextTodayWord() {
    if (currentTodayIndex < currentTodayWords.length - 1) {
      currentTodayIndex++
      showTodayWord()
    }
  }

  function updateTodayNavButtons() {
    $('btnTodayPrev').disabled = (currentTodayIndex === 0)
    $('btnTodayNext').disabled = (currentTodayIndex >= currentTodayWords.length - 1)
  }

  function showTodayComplete() {
    $('todayCard').style.display = 'none'
    $('todayComplete').style.display = 'block'
    $('todayCompleteSummary').textContent = '今天共 ' + currentTodayWords.length + ' 个单词，已全部完成复习！'
    updateBadges()
  }

  /* ---------- 艾宾浩斯复习（保留） ---------- */

  /* ==========================================
     今日汇总
     ========================================== */

  function renderSummaryTable() {
    var today = getToday()
    var wordSet = {}

    // 收集今日学过的所有单词索引
    if (appData.dailyLog[today] && appData.dailyLog[today].words) {
      appData.dailyLog[today].words.forEach(function (idx) { wordSet[idx] = true })
    }
    // 也收录当前会话中的单词
    if (appData.currentSession && appData.currentSession.date === today && appData.currentSession.learnWords) {
      appData.currentSession.learnWords.forEach(function (idx) { wordSet[idx] = true })
    }

    var indices = Object.keys(wordSet).map(Number).sort(function (a, b) { return a - b })

    if (indices.length === 0) {
      $('summaryEmpty').style.display = 'block'
      $('summaryTableWrap').style.display = 'none'
      return
    }

    $('summaryEmpty').style.display = 'none'
    $('summaryTableWrap').style.display = 'block'

    var html = ''
    indices.forEach(function (idx, i) {
      var word = allWords[idx]
      if (!word) return
      html += '<tr>'
      html += '<td class="sn-col">' + (i + 1) + '</td>'
      html += '<td class="sw-col">' + word.word + '</td>'
      html += '<td class="ph-col">' + (word.phonetic || '-') + '</td>'
      html += '<td>' + (word.pos ? word.pos + '. ' : '') + word.meaning + '</td>'
      html += '<td class="en-col">' + (word.sentence || '-') + '</td>'
      html += '</tr>'
    })

    $('summaryTableBody').innerHTML = html
  }

  function checkReviewQueue() {
    var today = getToday()
    var reviewIndices = getWordsForReview(today)
    currentReviewWords = reviewIndices
    currentReviewIndex = 0

    if (reviewIndices.length === 0) {
      $('reviewEmpty').style.display = 'block'
      $('reviewCard').style.display = 'none'
      $('reviewComplete').style.display = 'none'
    } else {
      $('reviewEmpty').style.display = 'none'
      $('reviewCard').style.display = 'block'
      $('reviewComplete').style.display = 'none'
      showReviewWord()
    }
  }

  function showReviewWord() {
    if (currentReviewIndex >= currentReviewWords.length) {
      showReviewComplete()
      return
    }

    var idx = currentReviewWords[currentReviewIndex]
    var word = allWords[idx]
    if (!word) {
      currentReviewIndex++
      showReviewWord()
      return
    }

    // 更新进度
    $('reviewProgress').textContent = '第 ' + (currentReviewIndex + 1) + '/' + currentReviewWords.length + ' 个'
    $('reviewProgressFill').style.width = ((currentReviewIndex) / currentReviewWords.length * 100) + '%'

    var p = appData.progress[idx]
    var stageLabel = p ? '第' + (p.reviewCount + 1) + '轮复习' : '复习'
    $('reviewBadgeLabel').textContent = stageLabel

    // 填充内容（先隐藏释义）
    $('reviewWord').textContent = word.word
    $('reviewPhonetic').textContent = word.phonetic || '-'
    $('reviewMeaning').textContent = (word.pos ? word.pos + '. ' : '') + word.meaning
    $('reviewMeaning').style.display = 'none'
    $('btnShowMeaning').style.display = 'inline-block'
    $('reviewSentenceSection').style.display = 'none'
    $('reviewMnemonicSection').style.display = 'none'

    // 重新动画
    var card = $('reviewCard')
    card.style.animation = 'none'
    card.offsetHeight
    card.style.animation = 'fadeInUp .3s ease'
    speakWord(currentReviewWords[currentReviewIndex])
  }

  function showMeaning() {
    var idx = currentReviewWords[currentReviewIndex]
    var word = allWords[idx]
    if (!word) return

    $('reviewMeaning').style.display = 'block'
    $('btnShowMeaning').style.display = 'none'

    if (word.sentence) {
      $('reviewSentenceSection').style.display = 'block'
      $('reviewSentence').textContent = word.sentence
      $('reviewSentenceCn').textContent = word.sentenceCn || ''
    }

    if (word.mnemonic) {
      $('reviewMnemonicSection').style.display = 'block'
      $('reviewMnemonic').textContent = word.mnemonic
    }
  }

  function handleReviewAnswer(remembered) {
    var idx = currentReviewWords[currentReviewIndex]
    markWordReviewed(idx, remembered)
    currentReviewIndex++
    showReviewWord()
  }

  function showReviewComplete() {
    $('reviewCard').style.display = 'none'
    $('reviewComplete').style.display = 'block'
    var today = getToday()
    var reviewed = appData.dailyLog[today] ? (appData.dailyLog[today].reviewed || 0) : 0
    $('reviewCompleteSummary').textContent = '今天共复习了 ' + reviewed + ' 个单词，继续保持！'
    updateBadges()
  }

  /* ==========================================
     统计页面
     ========================================== */
  function renderStats() {
    var stats = getStats()

    $('statTotal').textContent = stats.total
    $('statMastered').textContent = stats.mastered
    $('statReviewing').textContent = stats.reviewing
    $('statStreak').textContent = stats.streak

    var today = getToday()
    var todayLog = appData.dailyLog[today] || { newWords: 0, reviewed: 0 }
    $('statTodayNew').textContent = todayLog.newWords || 0
    $('statTodayReview').textContent = todayLog.reviewed || 0

    // 学习进度
    var bookTotal = allWords.length
    var learnedCount = Object.keys(appData.progress).length
    $('statBookTotal').textContent = bookTotal
    var pct = bookTotal > 0 ? Math.round(learnedCount / bookTotal * 100) : 0
    $('statBookPercent').textContent = pct + '%'
    $('statBookFill').style.width = pct + '%'

    // 阶段分布
    var stageHTML = ''
    var stages = Object.keys(stats.stageCounts).sort()
    if (stages.length === 0) {
      stageHTML = '<span class="stage-item">暂无数据，开始学习吧！</span>'
    } else {
      stages.forEach(function (stage) {
        stageHTML += '<span class="stage-item">' + stage + '：<span class="stage-count">' + stats.stageCounts[stage] + '</span> 个</span>'
      })
    }
    $('stageList').innerHTML = stageHTML

    // 近7天图表（双柱：新学 + 复习）
    var weekData = getWeekData()
    var maxVal = 1
    weekData.forEach(function (d) {
      if (d.newWords > maxVal) maxVal = d.newWords
      if (d.reviewed > maxVal) maxVal = d.reviewed
    })
    var chartHTML = ''
    weekData.forEach(function (d) {
      var newH = maxVal > 0 ? (d.newWords / maxVal * 100) : 0
      var revH = maxVal > 0 ? (d.reviewed / maxVal * 100) : 0
      var totalLabel = (d.newWords + d.reviewed)
      chartHTML += '<div class="week-bar-wrap">' +
        '<div class="week-count">' + totalLabel + '</div>' +
        '<div class="week-bar-group">' +
        '<div class="week-bar new-bar' + (d.isToday ? ' today' : '') + '" style="height:' + Math.max(newH, totalLabel > 0 ? 4 : 0) + '%" title="新学 ' + d.newWords + '"></div>' +
        '<div class="week-bar review-bar" style="height:' + Math.max(revH, totalLabel > 0 ? 4 : 0) + '%" title="复习 ' + d.reviewed + '"></div>' +
        '</div>' +
        '<div class="week-label">' + d.label + '</div>' +
        '</div>'
    })
    $('weekChart').innerHTML = chartHTML
  }

  /* ==========================================
     设置页面
     ========================================== */
  function renderSettings() {
    $('dailyCount').textContent = appData.settings.dailyCount

    // 复习间隔标签
    var intervalHTML = ''
    appData.settings.intervals.forEach(function (d) {
      intervalHTML += '<span class="interval-tag">' + d + '天</span>'
    })
    $('intervalTags').innerHTML = intervalHTML

    // 更新关于信息
    var aboutInfo = $('aboutBookInfo')
    if (aboutInfo && currentBook) {
      aboutInfo.textContent = '当前词库：' + currentBook.name + '（约 ' + allWords.length + ' 词）'
    }
  }

  function initSettingsPage() {
    var btnDec = $('btnDecDaily')
    var btnInc = $('btnIncDaily')
    var btnReset = $('btnResetProgress')
    var btnExport = $('btnExportData')
    var btnImport = $('btnImportData')
    var fileInput = $('importFileInput')

    if (btnDec) {
      btnDec.addEventListener('click', function () {
        if (appData.settings.dailyCount > 5) {
          appData.settings.dailyCount -= 5
          saveAppData()
          $('dailyCount').textContent = appData.settings.dailyCount
          showToast('每日新词数：' + appData.settings.dailyCount, 'success')
          updateBadges()
        }
      })
    }

    if (btnInc) {
      btnInc.addEventListener('click', function () {
        if (appData.settings.dailyCount < 100) {
          appData.settings.dailyCount += 5
          saveAppData()
          $('dailyCount').textContent = appData.settings.dailyCount
          showToast('每日新词数：' + appData.settings.dailyCount, 'success')
          updateBadges()
        }
      })
    }

    if (btnReset) {
      btnReset.addEventListener('click', function () {
        if (confirm('确定要重置所有学习进度吗？此操作不可恢复！')) {
          appData.progress = {}
          appData.dailyLog = {}
          appData.lastActiveDate = ''
          saveAppData()
          showToast('学习进度已重置', 'success')
          updateBadges()
          renderStats()
        }
      })
    }

    if (btnExport) {
      btnExport.addEventListener('click', function () {
        var dataStr = JSON.stringify(appData, null, 2)
        var blob = new Blob([dataStr], { type: 'application/json' })
        var url = URL.createObjectURL(blob)
        var a = document.createElement('a')
        a.href = url
        a.download = 'vocab-backup-' + getToday() + '.json'
        a.click()
        URL.revokeObjectURL(url)
        showToast('数据已导出', 'success')
      })
    }

    if (btnImport && fileInput) {
      btnImport.addEventListener('click', function () {
        fileInput.click()
      })
      fileInput.addEventListener('change', function () {
        var file = this.files[0]
        if (!file) return
        var reader = new FileReader()
        reader.onload = function (e) {
          try {
            var data = JSON.parse(e.target.result)
            if (data.progress && data.settings) {
              appData = data
              saveAppData()
              showToast('数据导入成功！', 'success')
              updateBadges()
              renderSettings()
            } else {
              showToast('数据格式不正确', 'error')
            }
          } catch (err) {
            showToast('数据解析失败', 'error')
          }
        }
        reader.readAsText(file)
        this.value = ''
      })
    }
  }

  /* ==========================================
     发音功能（Web Speech API + 降级方案）
     ========================================== */
  var isSpeaking = false

  var audioPlayer = null

  function speakWord(wordIndex) {
    var word = allWords[wordIndex]
    if (!word) return

    // 优先使用有道 TTS（国内可用，取消可靠）
    if (!audioPlayer) {
      audioPlayer = new Audio()
      audioPlayer.addEventListener('ended', function () {
        isSpeaking = false
        updateSpeakerButtons(false)
      })
      audioPlayer.addEventListener('error', function () {
        isSpeaking = false
        updateSpeakerButtons(false)
        // Audio 失败，降级到 Web Speech
        speechFallback(word.word)
      })
    }

    // 立即停止当前播放，切换到新单词
    audioPlayer.pause()
    audioPlayer.currentTime = 0
    audioPlayer.src = 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(word.word) + '&type=0'
    isSpeaking = true
    updateSpeakerButtons(true)
    audioPlayer.play().catch(function () {
      isSpeaking = false
      updateSpeakerButtons(false)
      speechFallback(word.word)
    })
  }

  function speechFallback(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    var utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    utterance.volume = 1
    utterance.onstart = function () {
      isSpeaking = true
      updateSpeakerButtons(true)
    }
    utterance.onend = function () {
      isSpeaking = false
      updateSpeakerButtons(false)
    }
    utterance.onerror = function () {
      isSpeaking = false
      updateSpeakerButtons(false)
    }
    window.speechSynthesis.speak(utterance)
  }

  // 更新发音按钮状态
  function updateSpeakerButtons(speaking) {
    var buttons = document.querySelectorAll('.btn-speaker')
    for (var i = 0; i < buttons.length; i++) {
      if (speaking) {
        buttons[i].style.color = 'var(--primary)'
        buttons[i].style.animation = 'pulse .6s ease infinite'
        buttons[i].textContent = '🔊'
      } else {
        buttons[i].style.color = ''
        buttons[i].style.animation = ''
        buttons[i].textContent = '🔊'
      }
    }
  }

  /* ==========================================
     Toast 提示
     ========================================== */
  function showToast(msg, type) {
    var toast = $('toast')
    if (!toast) return
    toast.textContent = msg
    toast.className = 'toast ' + (type || '')
    // 强制回流
    toast.offsetHeight
    toast.classList.add('show')
    clearTimeout(toast._timeout)
    toast._timeout = setTimeout(function () {
      toast.classList.remove('show')
    }, 2000)
  }

  /* ==========================================
     初始化
     ========================================== */
  function init() {
    loadAppData()
    currentBook = getCurrentBook()
    renderBooksPage()
    updateBookInfo()
    initNavigation()
    initLearnPage()
    initReviewPage()
    initSettingsPage()
    restoreLearnPage()

    // 分批加载词库：第一个文件加载完即可使用，其余后台加载
    loadWordData().then(function () {
      if (allWordsLoaded) {
        showToast('「' + currentBook.name + '」全部加载完成！共 ' + allWords.length + ' 个单词', 'success')
      }
    }).catch(function () {
      showToast('词库加载失败，请刷新页面重试', 'error')
    })
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()