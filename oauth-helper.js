const http = require('http');
const url = require('url');
const axios = require('axios');

// Configure these from your Google Cloud Console
// Set via environment variables:
//   export GOOGLE_CLIENT_ID="your-client-id"
//   export GOOGLE_CLIENT_SECRET="your-client-secret"

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ Missing environment variables!\n');
  console.error('Set these before running:');
  console.error('  export GOOGLE_CLIENT_ID="your-client-id"');
  console.error('  export GOOGLE_CLIENT_SECRET="your-client-secret"\n');
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/callback') {
    const code = parsedUrl.query.code;
    const error = parsedUrl.query.error;

    if (error) {
      res.writeHead(400);
      res.end(`❌ Erro: ${error}`);
      return;
    }

    if (!code) {
      res.writeHead(400);
      res.end('❌ Nenhum código recebido');
      return;
    }

    try {
      console.log('\n⏳ Trocando código pelo refresh token...\n');

      // Trocar código pelo token
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      });

      const refreshToken = response.data.refresh_token;
      const accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in;

      console.log('✅ Sucesso! Tokens obtidos:\n');
      console.log('═'.repeat(80));
      console.log('\n🔑 GOOGLE_REFRESH_TOKEN:\n');
      console.log(refreshToken);
      console.log('\n' + '═'.repeat(80));
      console.log('\n📋 Copie o token acima e configure no Vercel\n');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Google Calendar OAuth Success</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                padding: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                margin: 0;
              }
              .container {
                background: white;
                border-radius: 10px;
                padding: 40px;
                max-width: 600px;
                margin: 0 auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              }
              h1 {
                color: #4CAF50;
                margin-top: 0;
              }
              .token-box {
                background: #f5f5f5;
                border: 2px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                word-break: break-all;
                margin: 20px 0;
                position: relative;
              }
              .copy-btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                margin: 10px 0;
              }
              .copy-btn:hover {
                background: #764ba2;
              }
              .instructions {
                background: #e3f2fd;
                border-left: 4px solid #2196F3;
                padding: 15px;
                margin: 20px 0;
                border-radius: 3px;
              }
              .instructions h3 {
                margin-top: 0;
                color: #1976D2;
              }
              .instructions ol {
                margin: 10px 0;
                padding-left: 20px;
              }
              .instructions li {
                margin: 8px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✅ Autorização Bem-Sucedida!</h1>

              <p>Seu refresh token foi gerado com sucesso. Use-o para sincronizar o Google Calendar com Cedro.</p>

              <div class="instructions">
                <h3>📋 Próximos Passos:</h3>
                <ol>
                  <li>Copie o token abaixo</li>
                  <li>Vá para https://vercel.com/dashboard</li>
                  <li>Selecione seu projeto <strong>cedro-so</strong></li>
                  <li>Vá em <strong>Settings → Environment Variables</strong></li>
                  <li>Clique em <strong>Add New</strong></li>
                  <li>
                    <strong>Name:</strong> GOOGLE_REFRESH_TOKEN<br>
                    <strong>Value:</strong> (cole o token abaixo)<br>
                    <strong>Environments:</strong> ✓ Production ✓ Preview ✓ Development
                  </li>
                  <li>Clique <strong>Save</strong></li>
                </ol>
              </div>

              <h3>🔑 GOOGLE_REFRESH_TOKEN:</h3>
              <div class="token-box" id="token">${refreshToken}</div>
              <button class="copy-btn" onclick="copyToClipboard()">📋 Copiar Token</button>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

              <p style="color: #666; font-size: 14px;">
                <strong>Detalhes técnicos:</strong><br>
                Access Token (expira em ${expiresIn}s): ${accessToken.substring(0, 50)}...<br>
                Refresh Token válido indefinidamente (até ser revogado manualmente)
              </p>

              <p style="color: #999; font-size: 12px; text-align: center; margin-bottom: 0;">
                Você pode fechar esta aba agora.
              </p>
            </div>

            <script>
              function copyToClipboard() {
                const token = document.getElementById('token').textContent;
                navigator.clipboard.writeText(token).then(() => {
                  const btn = event.target;
                  const original = btn.textContent;
                  btn.textContent = '✅ Copiado!';
                  btn.style.background = '#4CAF50';
                  setTimeout(() => {
                    btn.textContent = original;
                    btn.style.background = '#667eea';
                  }, 2000);
                });
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('\n❌ Erro ao obter token:', error.response?.data || error.message);
      res.writeHead(500);
      res.end(`
        <html>
          <body style="font-family: Arial; padding: 20px;">
            <h1>❌ Erro ao obter token</h1>
            <p>${error.response?.data?.error_description || error.message}</p>
          </body>
        </html>
      `);
    }
  } else {
    res.writeHead(200);
    res.end('OAuth Helper rodando...');
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar');
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');

  const authUrlString = authUrl.toString();

  console.log('\n' + '═'.repeat(80));
  console.log('✅ Servidor OAuth rodando em http://localhost:3001');
  console.log('═'.repeat(80) + '\n');

  console.log('📍 Abra esta URL no seu navegador:\n');
  console.log(authUrlString);
  console.log('\n' + '═'.repeat(80));
  console.log('\n⏳ Aguardando sua autorização no Google...\n');
});

process.on('SIGINT', () => {
  console.log('\n\nServidor encerrado.');
  process.exit(0);
});
