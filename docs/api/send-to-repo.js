// Netlify Functions를 위한 서버리스 API
// 개인 리포지토리로 문제 전송

const { Octokit } = require('@octokit/rest');

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { userToken, problem, targetRepo } = JSON.parse(event.body);

    if (!userToken || !problem || !targetRepo) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    // GitHub API 클라이언트 생성
    const octokit = new Octokit({
      auth: userToken,
    });

    // 문제 파일 내용 생성
    const problemContent = generateProblemFile(problem);
    const fileName = `problems/${problem.category}/${problem.problem_id}_${problem.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;

    // 사용자의 리포지토리에 파일 생성
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: targetRepo.split('/')[0],
      repo: targetRepo.split('/')[1],
      path: fileName,
      message: `🎰 가챠에서 뽑은 문제: ${problem.problem_id}번 ${problem.title}`,
      content: Buffer.from(problemContent).toString('base64'),
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '문제가 성공적으로 전송되었습니다!',
        filePath: fileName,
      }),
    };

  } catch (error) {
    console.error('Error sending to repo:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to send problem to repository',
        details: error.message,
      }),
    };
  }
};

function generateProblemFile(problem) {
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `# ${problem.problem_id}번: ${problem.title}

## 📊 문제 정보
- **카테고리**: ${problem.category}
- **난이도**: ${problem.tier} (Level ${problem.level})
- **뽑은 날짜**: ${currentDate}
- **태그**: ${problem.tags ? problem.tags.join(', ') : '정보 없음'}

## 🔗 링크
- [BOJ 문제 페이지](https://www.acmicpc.net/problem/${problem.problem_id})
- [solved.ac 문제 페이지](https://solved.ac/problems/${problem.problem_id})

## 💡 문제 해결 과정

### 접근 방법
- [ ] 문제 이해 및 분석
- [ ] 알고리즘 설계
- [ ] 코드 구현
- [ ] 테스트 및 디버깅

### 코드

\`\`\`python
# 여기에 코드를 작성하세요

\`\`\`

### 시간 복잡도
- 

### 공간 복잡도
- 

### 배운 점
- 

### 참고 자료
- 

---
> 🎰 이 문제는 Algorithm Problem Gacha에서 뽑았습니다!
`;
}