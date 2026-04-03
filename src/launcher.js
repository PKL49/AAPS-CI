    function generateJks() {
  const btn = document.getElementById('generateJksBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '🔄 .........';
  btn.disabled = true;

  const forge = window.forge;
  forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, function (err, keys) {
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 20);
    const attrs = [{ name: 'commonName', value: 'aaps.app' }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // 產生10位英數字元的亂數密碼
    const generateRandomPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    const password = generateRandomPassword();
    const alias = 'key0';
    // 產生 PKCS#12 時，alias 要用 options.friendlyName，cert 直接傳入
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
      keys.privateKey,
      cert,
      password,
      { algorithm: '3des', friendlyName: alias }
    );
    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    const base64 = forge.util.encode64(p12Der);

    const keystoreSet = btoa(`${base64}|${password}|${alias}|${password}`);
    document.getElementById('keystoreSet').value = keystoreSet;

    // 還原按鈕
    btn.innerHTML = originalText;
    btn.disabled = false;
  });
}

    function convertJks() {
      const fileInput = document.getElementById('jksFile');
      const reader = new FileReader();
      if (!fileInput.files.length) return;
      reader.onload = function () {
        const binary = new Uint8Array(reader.result);
        const base64 = forge.util.encode64(forge.util.binary.raw.encode(binary));
        document.getElementById('keystoreBase64').value = base64;
      };
      reader.readAsArrayBuffer(fileInput.files[0]);
    }

    function copyToClipboard(id) {
      const el = document.getElementById(id);
      navigator.clipboard.writeText(el.value);
      showToast();
    }

    function copyToClipboardText(text) {
      navigator.clipboard.writeText(text);
      showToast();
    }

    const defaultClientId = "705061051276-5ssikkg2ag39l7hj9t63saq549n3s2n5.apps.googleusercontent.com";
    let redirectUri = "http://" + window.location.hostname + ":" + window.location.port + window.location.pathname;
    // 若 URL 有 lang 參數，redirectUri 也加上 lang
    (function() {
      const urlParams = new URLSearchParams(window.location.search);
      const lang = urlParams.get('lang');
      if (lang) {
        redirectUri += (redirectUri.includes('?') ? '&' : '?') + 'lang=' + encodeURIComponent(lang);
      }
    })();
    
    function toggleClientInput() {
      const input = document.getElementById('customClientId');
      const isCustom = document.querySelector('input[name="clientMode"]:checked').value === 'custom';
      input.style.display = isCustom ? 'block' : 'none';
    }

    async function startAuth() {
      let clientId = defaultClientId;
      const clientMode = document.querySelector('input[name="clientMode"]:checked').value;
      if (document.querySelector('input[name="clientMode"]:checked').value === 'custom') {
        clientId = document.getElementById('customClientId').value;
        sessionStorage.setItem('clientMode', clientMode);
        sessionStorage.setItem('customClientId', clientId);
      }
      const codeVerifier = [...crypto.getRandomValues(new Uint8Array(32))].map(b => ('0' + b.toString(16)).slice(-2)).join('');
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await crypto.subtle.digest('SHA-256', data);
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      sessionStorage.setItem("pkce_code_verifier", codeVerifier);
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file&access_type=offline&code_challenge_method=S256&code_challenge=${codeChallenge}`;
      window.location.href = authUrl;
    }

    async function exchangeCodeForToken(code) {
      const codeVerifier = sessionStorage.getItem("pkce_code_verifier");
      const clientId = document.querySelector('input[name="clientMode"]:checked').value === 'custom' ? document.getElementById('customClientId').value : defaultClientId;
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          code: code,
          code_verifier: codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        }).toString()
      });
      const data = await res.json();
      if (data.refresh_token) {
        // document.getElementById('refreshToken').value = data.refresh_token;
        document.getElementById('oauth2Base64').value = btoa(clientId + '|' + data.refresh_token);
        // 清除 URL 上的 code 參數，避免重複觸發
        window.history.replaceState({}, document.title, window.location.pathname);
        // 平滑卷動到 class="icon-drive" 的元素
        const iconDrive = document.querySelector('.icon-drive');
        if (iconDrive) {
          iconDrive.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }

