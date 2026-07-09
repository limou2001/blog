/**
 * 主题切换器
 * 在齿轮旁边添加主题切换按钮，点击弹框选择主题
 */

(function() {
  // 主题配置
  const themes = {
    none: { name: '默认主题', icon: '✨', color: '#666' },
    spring: { name: '春节', icon: '🎏', color: '#ff4444' },
    christmas: { name: '圣诞', icon: '🎄', color: '#228B22' },
    halloween: { name: '万圣节', icon: '🎃', color: '#ff8c00' }
  };

  let currentTheme = localStorage.getItem('blog-theme') || 'none';
  let selectedTheme = currentTheme;

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
      openThemeDialog();
    });

    // 插入到齿轮按钮前面
    cogBtn.parentNode.insertBefore(btn, cogBtn);
  }

  // 创建主题对话框
  function openThemeDialog() {
    selectedTheme = currentTheme;

    // 如果已存在对话框，先关闭
    closeThemeDialog();

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'theme-dialog-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // 创建对话框
    const dialog = document.createElement('div');
    dialog.id = 'theme-dialog';
    dialog.style.cssText = `
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      min-width: 420px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    `;

    // 标题
    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-color);
      text-align: center;
    `;
    title.textContent = '🎨 主题切换';
    dialog.appendChild(title);

    // 当前主题显示
    const currentLabel = document.createElement('div');
    currentLabel.style.cssText = `
      font-size: 12px;
      color: var(--text-color);
      margin-bottom: 8px;
      opacity: 0.8;
    `;
    currentLabel.textContent = '当前主题';
    dialog.appendChild(currentLabel);

    const currentItem = document.createElement('div');
    currentItem.id = 'theme-dialog-current';
    currentItem.style.cssText = `
      display: flex;
      align-items: center;
      padding: 10px 12px;
      margin-bottom: 16px;
      border-radius: 8px;
      background: var(--hover-bg);
      border: 2px solid ${themes[currentTheme].color};
    `;
    currentItem.innerHTML = `
      <span style="font-size: 18px; margin-right: 8px;">${themes[currentTheme].icon}</span>
      <span style="font-size: 14px; color: var(--text-color);">${themes[currentTheme].name}</span>
    `;
    dialog.appendChild(currentItem);

    // 可选主题下拉框
    const selectLabel = document.createElement('div');
    selectLabel.style.cssText = `
      font-size: 12px;
      color: var(--text-color);
      margin-bottom: 8px;
      opacity: 0.8;
    `;
    selectLabel.textContent = '选择主题';
    dialog.appendChild(selectLabel);

    const select = document.createElement('select');
    select.id = 'theme-select';
    select.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      margin-bottom: 20px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      color: var(--text-color);
      font-size: 14px;
      cursor: pointer;
      outline: none;
    `;

    Object.entries(themes).forEach(([key, theme]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${theme.icon} ${theme.name}`;
      if (key === selectedTheme) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      selectedTheme = e.target.value;
    });

    dialog.appendChild(select);

    // 按钮容器
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: center;
    `;

    // 取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = `
      padding: 8px 24px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-color);
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    `;
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = 'var(--hover-bg)';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = 'transparent';
    });
    cancelBtn.addEventListener('click', () => {
      closeThemeDialog();
    });

    // 确认按钮
    const confirmBtn = document.createElement('button');
    confirmBtn.style.cssText = `
      padding: 8px 24px;
      border-radius: 8px;
      border: none;
      background: var(--theme-color, #49B1F5);
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    `;
    confirmBtn.textContent = '确认';
    confirmBtn.addEventListener('mouseenter', () => {
      confirmBtn.style.opacity = '0.9';
    });
    confirmBtn.addEventListener('mouseleave', () => {
      confirmBtn.style.opacity = '1';
    });
    confirmBtn.addEventListener('click', () => {
      setTheme(selectedTheme);
      closeThemeDialog();
    });

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);
    dialog.appendChild(btnContainer);

    // 添加到页面
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeThemeDialog();
      }
    });

  }

  function closeThemeDialog() {
    const overlay = document.getElementById('theme-dialog-overlay');
    if (overlay) {
      overlay.remove();
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
  }

  // 初始化
  function init() {
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