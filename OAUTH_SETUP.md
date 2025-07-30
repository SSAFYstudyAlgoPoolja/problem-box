# 🔐 GitHub OAuth 완벽 설정 가이드

## 🎯 목표
진짜 GitHub 로그인으로 개인 리포지토리에 문제 자동 전송까지!

## 📋 1단계: GitHub App 생성

### 1️⃣ GitHub App 만들기
1. **GitHub** → **Settings** → **Developer settings** → **GitHub Apps**
2. **"New GitHub App"** 클릭
3. **설정값 입력**:

```
App name: Algorithm Problem Gacha
Homepage URL: https://SSAFYstudyAlgoPoolja.github.io/problem-box
Authorization callback URL: https://SSAFYstudyAlgoPoolja.github.io/problem-box/auth/callback
Webhook: ❌ (Inactive)
```

### 2️⃣ 권한 설정
**Repository permissions:**
- ✅ Contents: Read and write
- ✅ Metadata: Read
- ✅ Pull requests: Write (선택사항)

**Account permissions:**
- ✅ Email addresses: Read

### 3️⃣ 중요한 정보 복사
- **App ID**: 예) 123456
- **Client ID**: 예) Iv1.a1b2c3d4e5f6g7h8
- **Client Secret**: 예) 1234567890abcdef (Generate하고 복사)
- **Private Key**: Generate하고 .pem 파일 다운로드

## 📋 2단계: Netlify Functions 설정 (서버리스 백엔드)

### 1️⃣ Netlify 계정 생성
- [netlify.com](https://netlify.com) 가입 (GitHub 계정으로)

### 2️⃣ 프로젝트 구조 수정
```
problem-box/
├── netlify/
│   └── functions/
│       ├── auth-callback.js    # OAuth 토큰 교환
│       └── send-to-repo.js     # 개인 리포 전송
├── netlify.toml                # Netlify 설정
└── docs/                       # 기존 웹사이트
```

## 📋 3단계: 코드 구현

이제 실제 OAuth 시스템을 구현하겠습니다!