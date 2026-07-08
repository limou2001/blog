/**
 * 主题切换器
 * 在齿轮旁边添加主题切换按钮，点击弹框选择主题
 */

(function() {
  // 主题配置
  const themes = {
    none: { name: '无', icon: '✨', color: '#666' },
    spring: { name: '春节', icon: '🎏', color: '#ff4444' },
    christmas: { name: '圣诞', icon: '🎄', color: '#228B22' },
    halloween: { name: '万圣节', icon: '🎃', color: '#ff8c00' }
  };

  let currentTheme = localStorage.getItem('blog-theme') || 'none';

  // 创建主题切换按钮（在齿轮旁边）
  function createThemeButton() {
    // 等待齿轮按钮出现
    const waitForCog = setInterval(() => {
      const cogBtn = document.getElementById('rightside-config');
      if (cogBtn) {
        clearInterval(waitForCog);
        initThemeButton(cogBtn);
      }
    }, 500);

    setTimeout(() => clearInterval(waitForCog), 10000);
  }

  function initThemeButton(cogBtn) {
    // 创建主题切换按钮
    const btn = document.createElement('button');
    btn.id = 'theme-switch-btn';
    btn.type = 'button';
    btn.title = '主题切换';
    btn.textContent = '🎨';
    btn.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: var(--card-bg);
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      margin-right: 8px;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleThemePanel();
    });

    // 插入到齿轮按钮前面
    cogBtn.parentNode.insertBefore(btn, cogBtn);

    // 创建主题面板
    createThemePanel();
  }

  // 创建主题面板（弹框）
  function createThemePanel() {
    const panel = document.createElement('div');
    panel.id = 'theme-panel';
    panel.style.cssText = `
      position: absolute;
      bottom: 50px;
      right: 0;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 12px;
      z-index: 1001;
      display: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      min-width: 100px;
      transform: scale(1.1);
      transform-origin: bottom right;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 10px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-color);
      text-align: center;
    `;
    title.textContent = '🎨 主题切换';
    panel.appendChild(title);

    // 创建主题选项
    Object.entries(themes).forEach(([key, theme]) => {
      const item = document.createElement('div');
      item.className = 'theme-item';
      item.dataset.theme = key;
      item.style.cssText = `
        display: flex;
        align-items: center;
        padding: 7px 8px;
        margin: 4px 0;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: ${currentTheme === key ? 'var(--hover-bg)' : 'transparent'};
        border: 2px solid ${currentTheme === key ? theme.color : 'transparent'};
      `;

      item.innerHTML = `
        <span style="font-size: 12px; margin-right: 6px;">${theme.icon}</span>
        <span style="font-size: 10px; color: var(--text-color);">${theme.name}</span>
      `;

      item.addEventListener('click', () => {
        setTheme(key);
        closeThemePanel();
      });

      item.addEventListener('mouseenter', () => {
        if (currentTheme !== key) {
          item.style.background = 'var(--hover-bg)';
        }
      });

      item.addEventListener('mouseleave', () => {
        if (currentTheme !== key) {
          item.style.background = 'transparent';
        }
      });

      panel.appendChild(item);
    });

    // 插入到按钮旁边
    const btn = document.getElementById('theme-switch-btn');
    if (btn && btn.parentNode) {
      btn.parentNode.appendChild(panel);
    }

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      const themeBtn = document.getElementById('theme-switch-btn');
      if (!panel.contains(e.target) && (!themeBtn || !themeBtn.contains(e.target))) {
        closeThemePanel();
      }
    });
  }

  function toggleThemePanel() {
    const panel = document.getElementById('theme-panel');
    if (!panel) return;

    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      panel.style.animation = 'themePanelFadeIn 0.2s ease';
    } else {
      closeThemePanel();
    }
  }

  function closeThemePanel() {
    const panel = document.getElementById('theme-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }

  function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('blog-theme', theme);

    // 移除之前的特效容器
    const oldContainers = ['lantern-container', 'fireworks-container', 'christmas-container', 'halloween-container'];
    oldContainers.forEach(id => {
      const container = document.getElementById(id);
      if (container) container.remove();
    });

    // 根据主题创建特效
    if (theme === 'spring') {
      createLanterns();
      createFireworks();
    } else if (theme === 'christmas') {
      createChristmas();
    } else if (theme === 'halloween') {
      createHalloween();
    }

    // 更新面板选中状态
    document.querySelectorAll('.theme-item').forEach(item => {
      const isSelected = item.dataset.theme === theme;
      const themeConfig = themes[theme];
      item.style.background = isSelected ? 'var(--hover-bg)' : 'transparent';
      item.style.borderColor = isSelected ? themeConfig.color : 'transparent';
    });
  }

  // 初始化
  function init() {
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes themePanelFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    createThemeButton();

    // 页面加载后应用保存的主题
    if (currentTheme !== 'none') {
      setTheme(currentTheme);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();