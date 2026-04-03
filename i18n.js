// i18nStrings 已由 js/i18n.js 提供為 window.i18nStrings

    // 切換語言函式
    function switchLanguage(lang, updateUrl = true) {
      // 標準化語言 key
      let key = lang;
      if (key === 'zh-CN' || key === 'zh_cn' || key === 'zh_Hans') key = 'zh_CN';
      else if (key === 'zh-TW' || key === 'zh_tw' || key === 'zh_Hant') key = 'zh_TW';
      else if (key === 'pt-BR' || key === 'pt_br') key = 'pt_BR';
      else if (key === 'pt-PT' || key === 'pt_pt') key = 'pt_PT';
      
      const dict = i18nStrings[key] || i18nStrings['en'];
      document.getElementById('langSelector').value = lang;
      // 依據 data-i18n 屬性批次替換
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if (dict[k]) el.innerText = dict[k];
      });
      // 處理 placeholder
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const k = el.getAttribute('data-i18n-placeholder');
        if (dict[k]) el.placeholder = dict[k];
      });
      // 更新 toast 內容
      document.getElementById('copyToast').innerText = dict.toastCopied;
      // 語言切換時更新網址參數
      if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.location.href = url.toString();
      }
    }

    // 頁面載入時自動偵測語言
    window.addEventListener('DOMContentLoaded', function() {
      // 先檢查 URL 是否有 lang 參數
      const urlParams = new URLSearchParams(window.location.search);
      let lang = urlParams.get('lang');
      if (!lang) {
        lang = (navigator.language || navigator.userLanguage || 'en');
        // 標準化
        if (lang.toLowerCase().startsWith('zh')) {
          if (lang.toLowerCase().includes('tw') || lang.toLowerCase().includes('hant')) lang = 'zh_TW';
          else lang = 'zh-CN';
        } else if (lang.toLowerCase().startsWith('pt')) {
          if (lang.toLowerCase().includes('br')) lang = 'pt-BR';
          else lang = 'pt-PT';
        } else if (lang.toLowerCase().startsWith('sr')) {
          lang = 'sr-Latn';
        } else {
          lang = lang.split('-')[0];
        }
      }
      switchLanguage(lang, false);
    });
    function showToast(message) {
        const toast = document.getElementById('copyToast');
        toast.textContent = message || (i18nStrings[document.getElementById('langSelector').value] || i18nStrings['en']).toastCopied;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 2000);
    }
    
    function toggleOption(optionNumber) {
        // 關閉所有選項
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('active');
        });
        
        // 開啟被點擊的選項
        document.getElementById('option' + optionNumber).classList.add('active');
    }
    
    // page init
    window.onload = function() {

      const lang = document.getElementById('langSelector').value;
      document.getElementById('langSelector').addEventListener('change', function(e) {
        switchLanguage(e.target.value, true);
      });

      // <!-- if (window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost') { -->
        // <!-- var msg = (i18nStrings && i18nStrings[lang] && i18nStrings[lang].fileManagerAlert); -->
        // <!-- alert(msg); -->
        // <!-- window.location.href = 'https://play.google.com/store/apps/details?id=com.alphainventor.filemanager'; -->
      // <!-- } -->

      const urlParams = new URLSearchParams(window.location.search);
      // 保留原始的 code 處理
      if (urlParams.has('code')) {
          const code = urlParams.get('code');
          exchangeCodeForToken(code);
          
          const clientMode = sessionStorage.getItem('clientMode');
          const customClientId = sessionStorage.getItem('customClientId');
          if (clientMode) {
            const radio = document.querySelector(`input[name="clientMode"][value="${clientMode}"]`);
            if (radio) radio.checked = true;

            if (clientMode === 'custom') {
              const input = document.getElementById('customClientId');
              input.value = customClientId;
              input.style.display = 'block';
            }
            sessionStorage.removeItem('clientMode');
            sessionStorage.removeItem('customClientId');
          }
          return;
      }
      toggleOption(1);
      var customClientInput = document.getElementById('customClientId');
      if (customClientInput) customClientInput.style.display = 'none';
    };