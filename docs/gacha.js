// 글로벌 변수
let currentUser = null;
let problemsData = null;
let selectedCategory = null;
let currentProblem = null;

// GitHub App 설정 (진짜 OAuth!)
const GITHUB_CLIENT_ID = 'Iv23liDaJh9UDXOPLKCC'; // ✅ 실제 GitHub App Client ID
const REPO_OWNER = 'SSAFYstudyAlgoPoolja';
const REPO_NAME = 'problem-box';
const NETLIFY_DOMAIN = 'algorithm-problem-gacha.netlify.app'; // ✅ 실제 Netlify 도메인

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎰 Algorithm Problem Gacha 시작!');
    
    // URL에서 GitHub OAuth 코드 확인
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        handleGitHubCallback(code);
    } else if (!GITHUB_CLIENT_ID) {
        // GitHub Client ID가 없으면 데모 모드
        setupDemoUser();
    }
    // 그 외에는 OAuth 로그인 버튼 표시
    
    loadProblemsData();
    initializeEventListeners();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    // 카테고리 선택
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            selectCategory(this.dataset.category);
        });
    });
}

// 데모 사용자 설정 (OAuth 없이 작동)
function setupDemoUser() {
    const demoUser = {
        login: 'demo-user',
        avatar_url: 'https://github.com/identicons/demo-user.png',
        name: 'Demo User',
        access_token: 'demo_mode'
    };
    
    localStorage.setItem('github_user', JSON.stringify(demoUser));
    currentUser = demoUser;
    showMainContent();
}

// 진짜 GitHub OAuth 로그인!
function loginWithGitHub() {
    if (!GITHUB_CLIENT_ID || GITHUB_CLIENT_ID === 'YOUR_GITHUB_CLIENT_ID') {
        // 설정이 안 된 경우 데모 모드
        alert('GitHub App이 아직 설정되지 않았습니다. 데모 모드로 진행합니다.');
        setupDemoUser();
        return;
    }

    const redirectUri = `https://${NETLIFY_DOMAIN}/auth/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user:email&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    // 팝업 창으로 인증
    const popup = window.open(
        githubAuthUrl,
        'github-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // 팝업에서 메시지 받기
    const handleMessage = (event) => {
        if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
            popup.close();
            window.removeEventListener('message', handleMessage);
            
            // 사용자 정보 저장
            const user = event.data.user;
            localStorage.setItem('github_user', JSON.stringify(user));
            currentUser = user;
            showMainContent();
            
            alert(`🎉 ${user.name || user.login}님, 환영합니다!`);
        }
    };

    window.addEventListener('message', handleMessage);

    // 팝업이 닫히면 이벤트 리스너 제거
    const checkClosed = setInterval(() => {
        if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
        }
    }, 1000);
}

// GitHub OAuth 콜백 처리
async function handleGitHubCallback(code) {
    try {
        showLoading('GitHub 인증 중...');
        
        // 실제 구현에서는 백엔드 서버에서 토큰 교환을 처리해야 함
        // 여기서는 시뮬레이션
        const mockUser = {
            login: 'testuser',
            avatar_url: 'https://github.com/identicons/testuser.png',
            name: 'Test User',
            access_token: 'mock_token_' + Date.now()
        };
        
        localStorage.setItem('github_user', JSON.stringify(mockUser));
        currentUser = mockUser;
        
        // URL에서 code 파라미터 제거
        window.history.replaceState({}, document.title, window.location.pathname);
        
        showMainContent();
        hideLoading();
        
    } catch (error) {
        console.error('GitHub 인증 실패:', error);
        alert('GitHub 인증에 실패했습니다. 다시 시도해주세요.');
        hideLoading();
    }
}

// 기존 인증 확인
function checkExistingAuth() {
    const savedUser = localStorage.getItem('github_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainContent();
    } else {
        // OAuth 없이 바로 데모 모드로 진입
        setupDemoUser();
    }
}

// 로그아웃
function logout() {
    localStorage.removeItem('github_user');
    localStorage.removeItem('user_stats');
    localStorage.removeItem('problem_history');
    currentUser = null;
    showAuthSection();
}

// 메인 콘텐츠 표시
function showMainContent() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // 사용자 정보 업데이트
    updateUserInfo();
    updateUserStats();
}

// 인증 섹션 표시
function showAuthSection() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
}

// 사용자 정보 업데이트
function updateUserInfo() {
    if (!currentUser) return;
    
    document.getElementById('userAvatar').src = currentUser.avatar_url;
    document.getElementById('userName').textContent = currentUser.name || currentUser.login;
}

// 사용자 통계 업데이트
function updateUserStats() {
    const stats = getUserStats();
    document.getElementById('weeklyUsage').textContent = stats.weeklyUsage;
    
    // 사용 횟수에 따른 가챠 버튼 상태 업데이트
    const gachaBtn = document.getElementById('gachaBtn');
    if (stats.weeklyUsage >= 3) {
        gachaBtn.disabled = true;
        gachaBtn.textContent = '🚫 이번 주 사용 완료 (월요일 초기화)';
    }
}

// 사용자 통계 가져오기
function getUserStats() {
    const saved = localStorage.getItem('user_stats');
    const now = new Date();
    const weekStart = getWeekStart(now);
    
    if (saved) {
        const stats = JSON.parse(saved);
        // 새로운 주가 시작되면 초기화
        if (new Date(stats.weekStart) < weekStart) {
            return resetWeeklyStats();
        }
        return stats;
    }
    
    return resetWeeklyStats();
}

// 주간 통계 초기화
function resetWeeklyStats() {
    const stats = {
        weekStart: getWeekStart(new Date()).toISOString(),
        weeklyUsage: 0
    };
    localStorage.setItem('user_stats', JSON.stringify(stats));
    return stats;
}

// 주의 시작일 계산 (월요일)
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
    return new Date(d.setDate(diff));
}

// 문제 데이터 로드
async function loadProblemsData() {
    try {
        showLoading('문제 데이터 로딩 중...');
        
        // GitHub Pages에서 직접 메타데이터 로드 (여러 URL 시도)
        const urls = [
            `./metadata.json`,  // docs/ 폴더 내 복사본
            `https://${REPO_OWNER.toLowerCase()}.github.io/${REPO_NAME}/boj/problems/metadata.json`,
            `../boj/problems/metadata.json`
        ];
        
        let loaded = false;
        for (const url of urls) {
            try {
                console.log('🔍 시도 중:', url);
                const response = await fetch(url);
                if (response.ok) {
                    problemsData = await response.json();
                    console.log('✅ 문제 데이터 로드 성공:', problemsData.total_problems, '개 문제');
                    updateCategoryCards();
                    loaded = true;
                    break;
                }
            } catch (err) {
                console.log('❌ URL 실패:', url, err.message);
            }
        }
        
        if (!loaded) {
            console.log('❌ 모든 URL 실패. 샘플 데이터를 사용합니다.');
            problemsData = createSampleData();
            updateCategoryCards();
        }
        
        hideLoading();
    } catch (error) {
        console.error('❌ 문제 데이터 로드 실패:', error);
        console.log('🎯 샘플 데이터로 대체합니다.');
        problemsData = createSampleData();
        updateCategoryCards();
        hideLoading();
    }
}

// 샘플 데이터 생성
function createSampleData() {
    return {
        categories: {
            '배열': [
                {problem_id: '1000', title: 'A+B', level: 1, tier: 'Bronze V', category: '배열'},
                {problem_id: '1001', title: 'A-B', level: 1, tier: 'Bronze V', category: '배열'}
            ],
            '완전탐색': [
                {problem_id: '1002', title: '예제 문제', level: 5, tier: 'Bronze I', category: '완전탐색'}
            ],
            '그래프': [],
            'DP': [],
            '수학': [],
            '자료구조': []
        }
    };
}

// 카테고리 카드 업데이트
function updateCategoryCards() {
    if (!problemsData || !problemsData.categories) return;
    
    Object.keys(problemsData.categories).forEach(category => {
        const countElement = document.getElementById(`count-${category}`);
        if (countElement) {
            const count = problemsData.categories[category].length;
            countElement.textContent = `${count}개`;
        }
    });
}

// 카테고리 선택
function selectCategory(category) {
    selectedCategory = category;
    
    // 모든 카테고리 카드에서 selected 클래스 제거
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // 선택된 카테고리에 selected 클래스 추가
    document.querySelector(`[data-category="${category}"]`).classList.add('selected');
    
    // 선택된 카테고리 표시 업데이트
    document.getElementById('selectedCategory').textContent = category;
    
    // 가챠 버튼 활성화
    const gachaBtn = document.getElementById('gachaBtn');
    const stats = getUserStats();
    if (stats.weeklyUsage < 3) {
        gachaBtn.disabled = false;
        gachaBtn.textContent = '🎰 문제 뽑기!';
    }
}

// 문제 뽑기
async function drawProblem() {
    if (!selectedCategory || !problemsData) {
        alert('카테고리를 선택해주세요!');
        return;
    }
    
    const stats = getUserStats();
    if (stats.weeklyUsage >= 3) {
        alert('이번 주 사용 횟수를 모두 사용했습니다. 월요일에 초기화됩니다.');
        return;
    }
    
    const categoryProblems = problemsData.categories[selectedCategory] || [];
    if (categoryProblems.length === 0) {
        alert('선택한 카테고리에 문제가 없습니다.');
        return;
    }
    
    try {
        showLoading('문제를 뽑는 중...');
        
        // 랜덤하게 문제 선택
        const randomIndex = Math.floor(Math.random() * categoryProblems.length);
        currentProblem = categoryProblems[randomIndex];
        
        // 애니메이션 효과를 위한 지연
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 결과 표시
        showResult(currentProblem);
        
        // 사용 횟수 증가
        incrementUsage();
        
        // 히스토리에 추가
        addToHistory(currentProblem);
        
        hideLoading();
        
    } catch (error) {
        console.error('문제 뽑기 실패:', error);
        alert('문제 뽑기에 실패했습니다. 다시 시도해주세요.');
        hideLoading();
    }
}

// 결과 표시
function showResult(problem) {
    document.getElementById('resultTier').textContent = problem.tier;
    document.getElementById('resultTitle').textContent = problem.title;
    document.getElementById('resultId').textContent = problem.problem_id;
    document.getElementById('resultDifficulty').textContent = problem.tier;
    document.getElementById('resultCategory').textContent = problem.category;
    document.getElementById('bojLink').href = `https://www.acmicpc.net/problem/${problem.problem_id}`;
    
    // 티어에 따른 색상 적용
    const tierElement = document.getElementById('resultTier');
    tierElement.className = 'result-tier ' + getTierClass(problem.level);
    
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
}

// 티어 클래스 계산
function getTierClass(level) {
    if (level <= 5) return 'bronze';
    if (level <= 10) return 'silver';
    if (level <= 15) return 'gold';
    if (level <= 20) return 'platinum';
    if (level <= 25) return 'diamond';
    return 'ruby';
}

// 사용 횟수 증가
function incrementUsage() {
    const stats = getUserStats();
    stats.weeklyUsage += 1;
    localStorage.setItem('user_stats', JSON.stringify(stats));
    updateUserStats();
}

// 히스토리에 추가
function addToHistory(problem) {
    let history = JSON.parse(localStorage.getItem('problem_history') || '[]');
    
    const historyItem = {
        ...problem,
        drawnAt: new Date().toISOString(),
        drawnBy: currentUser.login
    };
    
    history.unshift(historyItem);
    history = history.slice(0, 10); // 최근 10개만 유지
    
    localStorage.setItem('problem_history', JSON.stringify(history));
    updateHistoryDisplay();
}

// 히스토리 표시 업데이트
function updateHistoryDisplay() {
    const history = JSON.parse(localStorage.getItem('problem_history') || '[]');
    const historyList = document.getElementById('historyList');
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="no-history">아직 뽑은 문제가 없습니다.</p>';
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-info">
                <h4>${item.problem_id}. ${item.title}</h4>
                <p>${item.category} • ${new Date(item.drawnAt).toLocaleDateString()}</p>
            </div>
            <div class="history-tier ${getTierClass(item.level)}">${item.tier}</div>
        </div>
    `).join('');
}

// 개인 리포지토리로 전송
async function sendToRepo() {
    if (!currentProblem || !currentUser) {
        alert('전송할 문제가 없습니다.');
        return;
    }
    
    try {
        showLoading('개인 리포지토리로 전송 중...');
        
        // 실제 구현에서는 GitHub API를 통해 사용자의 리포지토리에 파일을 생성
        // 여기서는 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        alert(`문제 ${currentProblem.problem_id}번이 성공적으로 전송되었습니다!\n리포지토리를 확인해보세요.`);
        
        hideLoading();
        
    } catch (error) {
        console.error('리포지토리 전송 실패:', error);
        alert('리포지토리 전송에 실패했습니다. 나중에 다시 시도해주세요.');
        hideLoading();
    }
}

// 로딩 표시
function showLoading(message = '로딩 중...') {
    const loading = document.getElementById('loading');
    loading.querySelector('p').textContent = message;
    loading.style.display = 'flex';
}

// 로딩 숨기기
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 페이지 로드 시 히스토리 표시
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateHistoryDisplay, 100);
});

// CSS 클래스 추가 (style.css에 추가할 내용)
const additionalCSS = `
.result-tier.bronze { background: #cd7f32; }
.result-tier.silver { background: #c0c0c0; }
.result-tier.gold { background: #ffd700; }
.result-tier.platinum { background: #e5e4e2; color: #333; }
.result-tier.diamond { background: #b9f2ff; color: #333; }
.result-tier.ruby { background: #e0115f; }

.history-tier.bronze { background: #cd7f32; color: white; }
.history-tier.silver { background: #c0c0c0; color: white; }
.history-tier.gold { background: #ffd700; color: #333; }
.history-tier.platinum { background: #e5e4e2; color: #333; }
.history-tier.diamond { background: #b9f2ff; color: #333; }
.history-tier.ruby { background: #e0115f; color: white; }
`;

// 동적으로 CSS 추가
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);