# 🎰 Algorithm Problem Gacha 설정 가이드

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 구조](#시스템-구조)  
3. [설정 단계](#설정-단계)
4. [GitHub Actions 설정](#github-actions-설정)
5. [GitHub Pages 설정](#github-pages-설정)
6. [GitHub App 설정](#github-app-설정)
7. [문제 해결](#문제-해결)

## 🎯 프로젝트 개요

**Algorithm Problem Gacha**는 스터디 그룹을 위한 알고리즘 문제 관리 시스템입니다:

- 🕷️ **자동 크롤링**: BOJ 문제를 자동으로 수집하고 분류
- 🎰 **가챠 시스템**: 카테고리별로 랜덤하게 문제 뽑기
- 📊 **스터디 관리**: 사용자별 주 3회 제한, 문제 히스토리 관리
- 🚀 **자동 전송**: 뽑은 문제를 개인 리포지토리로 자동 전송

## 🏗️ 시스템 구조

```
problem-box/
├── boj/                    # 크롤링 시스템
│   ├── fetch_and_upload.py # 메인 크롤링 스크립트
│   ├── problem_id.md       # 크롤링할 문제 ID 목록
│   └── problems/           # 수집된 문제들
│       └── metadata.json   # 문제 메타데이터
├── docs/                   # GitHub Pages 웹사이트
│   ├── index.html         # 가챠 메인 페이지
│   ├── style.css          # 스타일시트
│   ├── gacha.js           # 가챠 로직
│   └── api/               # 서버리스 API
└── .github/workflows/      # GitHub Actions
    └── fetch-upload.yml   # 자동 크롤링 워크플로우
```

## 🚀 설정 단계

### 1. 리포지토리 포크 및 클론

```bash
# 1. GitHub에서 이 리포지토리를 Fork
# 2. 로컬에 클론
git clone https://github.com/YOUR_ORG/problem-box.git
cd problem-box

# 3. 조직 이름 변경 (필요시)
# boj/fetch_and_upload.py에서 REPO_NAME 수정
```

### 2. GitHub Personal Access Token 생성

1. **GitHub Settings** → **Developer settings** → **Personal access tokens**
2. **Generate new token (classic)** 클릭
3. **권한 설정**:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. 토큰 복사 후 안전한 곳에 보관

### 3. Repository Secrets 설정

1. **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. 다음 Secret 추가:
   - **Name**: `MY_GITHUB_TOKEN`
   - **Value**: 위에서 생성한 Personal Access Token

## ⚙️ GitHub Actions 설정

### 자동 크롤링 활성화

1. **Actions 탭**에서 워크플로우 확인
2. `boj/problem_id.md` 파일 수정하여 크롤링할 문제 ID 추가:

```markdown
--start
1000
1001
2557
1234
5678
--end
```

3. 파일 커밋 시 자동으로 크롤링 실행
4. `boj/problems/` 폴더에 문제 파일들이 생성됨

### 크롤링 결과 확인

- **Actions 탭**에서 워크플로우 실행 로그 확인
- 성공 시 `boj/problems/metadata.json` 파일 생성
- 각 문제별 마크다운 파일 생성

## 🌐 GitHub Pages 설정

### 1. Pages 활성화

1. **Repository Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main` 또는 `master`
4. **Folder**: `/docs`
5. **Save** 클릭

### 2. 도메인 확인

- 설정 완료 후 `https://YOUR_ORG.github.io/problem-box`에서 접속 가능
- `docs/_config.yml`에서 URL 설정 확인

### 3. 웹사이트 테스트

1. 위 URL로 접속
2. GitHub 로그인 버튼 확인
3. 카테고리별 문제 수 확인

## 🔐 GitHub App 설정 (고급)

개인 리포지토리 자동 전송 기능을 위해 GitHub App이 필요합니다:

### 1. GitHub App 생성

1. **GitHub Settings** → **Developer settings** → **GitHub Apps**
2. **New GitHub App** 클릭
3. **설정값**:
   - **App name**: `Algorithm Problem Gacha`
   - **Homepage URL**: `https://YOUR_ORG.github.io/problem-box`
   - **Callback URL**: `https://YOUR_ORG.github.io/problem-box`
   - **Webhook**: Inactive
   
4. **Permissions**:
   - Repository permissions:
     - ✅ Contents: Write
     - ✅ Metadata: Read
   - Account permissions:
     - ✅ Email addresses: Read

### 2. App 설치 및 설정

1. **Install App** → 개인 계정 또는 조직에 설치
2. **Client ID** 복사
3. `docs/gacha.js`에서 `GITHUB_CLIENT_ID` 수정

### 3. 서버리스 API 배포 (Netlify)

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# Netlify에 배포
netlify init
netlify deploy --prod

# Environment Variables 설정
# GITHUB_APP_PRIVATE_KEY: GitHub App Private Key
```

## 🔧 문제 해결

### 크롤링 관련

**Q: HTTP 403 에러가 발생해요**
- A: BOJ 사이트에서 차단된 경우입니다. solved.ac API가 자동으로 사용됩니다.

**Q: GitHub 업로드가 실패해요**
- A: Personal Access Token 권한을 확인하세요. `repo` 권한이 필요합니다.

**Q: 메타데이터가 생성되지 않아요**
- A: solved.ac API를 통해 문제를 가져온 경우에만 메타데이터가 생성됩니다.

### 가챠 웹사이트 관련

**Q: GitHub 로그인이 안돼요**
- A: GitHub App Client ID가 올바르게 설정되었는지 확인하세요.

**Q: 문제 수가 0개로 표시돼요**
- A: `metadata.json` 파일이 생성되었는지 확인하세요. 크롤링을 먼저 실행해야 합니다.

**Q: 개인 리포지토리 전송이 안돼요**
- A: 현재는 시뮬레이션 모드입니다. 실제 구현을 위해서는 서버리스 API 설정이 필요합니다.

## 📞 지원

문제가 있으시면 Issue를 생성해주세요:
- 🐛 **버그 리포트**: 오류 로그와 함께 상세히 설명
- 💡 **기능 요청**: 원하는 기능과 사용 사례 설명
- ❓ **질문**: 설정이나 사용법 관련 문의

---

> 🎰 **Happy Coding!** 매주 새로운 알고리즘 문제로 실력을 향상시켜보세요!