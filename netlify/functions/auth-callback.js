const https = require('https');

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'text/html'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { code, state } = event.queryStringParameters || {};
    
    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: `
          <!DOCTYPE html>
          <html>
          <head><title>인증 실패</title></head>
          <body>
            <h1>❌ 인증 실패</h1>
            <p>GitHub 인증 코드가 없습니다.</p>
            <a href="/">다시 시도하기</a>
          </body>
          </html>
        `
      };
    }

    // GitHub에서 액세스 토큰 받기
    const tokenData = await exchangeCodeForToken(code);
    
    if (!tokenData.access_token) {
      throw new Error('토큰 교환 실패');
    }

    // 사용자 정보 가져오기
    const userData = await getUserData(tokenData.access_token);

    // 성공 페이지 반환 (postMessage로 부모 창에 데이터 전달)
    return {
      statusCode: 200,
      headers,
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>GitHub 로그인 성공</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #28a745; }
          </style>
        </head>
        <body>
          <h1 class="success">✅ GitHub 로그인 성공!</h1>
          <p>잠시만 기다려주세요...</p>
          <script>
            const userData = ${JSON.stringify({
              ...userData,
              access_token: tokenData.access_token
            })};
            
            // 부모 창에 데이터 전달
            if (window.opener) {
              window.opener.postMessage({
                type: 'GITHUB_AUTH_SUCCESS',
                user: userData
              }, '*');
              window.close();
            } else {
              // 부모 창이 없으면 리다이렉트
              localStorage.setItem('github_user', JSON.stringify(userData));
              window.location.href = '/';
            }
          </script>
        </body>
        </html>
      `
    };

  } catch (error) {
    console.error('OAuth 에러:', error);
    
    return {
      statusCode: 500,
      headers,
      body: `
        <!DOCTYPE html>
        <html>
        <head><title>인증 오류</title></head>
        <body>
          <h1>❌ 인증 오류</h1>
          <p>GitHub 인증 중 오류가 발생했습니다: ${error.message}</p>
          <a href="/">다시 시도하기</a>
        </body>
        </html>
      `
    };
  }
};

function exchangeCodeForToken(code) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET, 
      code: code
    });

    const options = {
      hostname: 'github.com',
      port: 443,
      path: '/login/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Algorithm-Problem-Gacha'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getUserData(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/user',
      method: 'GET',
      headers: {
        'Authorization': `token ${accessToken}`,
        'User-Agent': 'Algorithm-Problem-Gacha'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}