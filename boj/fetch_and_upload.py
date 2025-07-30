import requests
from bs4 import BeautifulSoup
from github import Github
import base64
import os
import time
import random

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_NAME = "SSAFYstudyAlgoPoolja/problem-box"
PROBLEMS_PATH = "boj/problems"

def fetch_problem_from_solved_ac(problem_id):
    """solved.ac API를 통해 문제 정보 가져오기 (대안)"""
    try:
        # solved.ac API 호출
        url = f"https://solved.ac/api/v3/problem/show?problemId={problem_id}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            return None
            
        data = res.json()
        
        # 기본적인 문제 정보만 제공 (solved.ac는 문제 설명을 제공하지 않음)
        title = data.get('titleKo', f'문제 {problem_id}')
        level = data.get('level', 0)
        tags = [tag.get('displayNames', [{}])[0].get('name', '') for tag in data.get('tags', [])]
        
        return f"""# {problem_id}. {title}

## 📊 문제 정보
- **난이도**: {level}
- **태그**: {', '.join(tags) if tags else '없음'}

## 🔗 문제 링크
- [BOJ 문제 페이지](https://www.acmicpc.net/problem/{problem_id})
- [solved.ac 문제 페이지](https://solved.ac/problems/{problem_id})

> ⚠️ 이 문제는 solved.ac API를 통해 생성되었습니다. 
> 자세한 문제 설명은 BOJ 페이지를 참고해주세요.
"""
    except Exception as e:
        print(f"❌ solved.ac API 실패: {e}")
        return None

def fetch_problem(problem_id):
    # 다양한 User-Agent 목록
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ]
    
    url = f"https://www.acmicpc.net/problem/{problem_id}"
    
    # 더 현실적인 브라우저 헤더
    headers = {
        'User-Agent': random.choice(user_agents),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    }
    
    # 세션 사용으로 연결 유지
    session = requests.Session()
    session.headers.update(headers)
    
    try:
        # 랜덤 지연으로 자연스러운 요청 패턴 생성
        time.sleep(random.uniform(2, 5))
        
        res = session.get(url, timeout=15)
        if res.status_code != 200:
            print(f"❌ 문제 {problem_id} 가져오기 실패 (HTTP {res.status_code})")
            return None
    except Exception as e:
        print(f"❌ 문제 {problem_id} 네트워크 오류: {e}")
        return None

    soup = BeautifulSoup(res.text, 'html.parser')
    try:
        title = soup.select_one('#problem_title').text.strip()
        desc = soup.select_one('#problem_description').text.strip()
        input_desc = soup.select_one('#problem_input').text.strip()
        output_desc = soup.select_one('#problem_output').text.strip()

        samples = soup.select('.sampledata')
        sample_input = samples[0].text.strip() if samples else ''
        sample_output = samples[1].text.strip() if len(samples) > 1 else ''
    except Exception as e:
        print(f"❌ 파싱 실패: {e}")
        return None

    return f"""# {problem_id}. {title}

## 📘 문제 설명
{desc}

## 📥 입력
{input_desc}

## 📤 출력
{output_desc}

## 🧪 입력 예시
```
{sample_input}
```

## 🧪 출력 예시
```
{sample_output}
```

## 🔗 문제 링크
https://www.acmicpc.net/problem/{problem_id}
"""

def upload_to_github(problem_id, content):
    try:
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(REPO_NAME)
        
        file_path = f"{PROBLEMS_PATH}/{problem_id}.md"
        
        try:
            # 파일이 이미 존재하는지 확인
            existing_file = repo.get_contents(file_path)
            # 파일이 존재하면 업데이트
            repo.update_file(
                path=file_path,
                message=f"📝 문제 {problem_id} 업데이트",
                content=content,
                sha=existing_file.sha
            )
            print(f"✅ 문제 {problem_id} 업데이트 완료")
        except:
            # 파일이 존재하지 않으면 새로 생성
            repo.create_file(
                path=file_path,
                message=f"✨ 문제 {problem_id} 추가",
                content=content
            )
            print(f"✅ 문제 {problem_id} 생성 완료")
            
    except Exception as e:
        print(f"❌ GitHub 업로드 실패: {e}")
        return False
    
    return True

def read_problem_ids():
    """problem_id.md 파일에서 문제 ID 목록을 읽어옴"""
    try:
        with open('boj/problem_id.md', 'r', encoding='utf-8') as f:
            lines = f.read().strip().split('\n')
        
        problem_ids = []
        start_found = False
        
        for line in lines:
            line = line.strip()
            if line == '--start':
                start_found = True
                continue
            elif line == '--end':
                break
            elif start_found and line.isdigit():
                problem_ids.append(line)
        
        return problem_ids
    except Exception as e:
        print(f"❌ problem_id.md 읽기 실패: {e}")
        return []

def test_github_token():
    """GitHub 토큰 권한 테스트"""
    try:
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(REPO_NAME)
        print(f"✅ GitHub 연결 성공: {repo.full_name}")
        
        # 권한 테스트를 위해 리포지토리 정보 가져오기
        print(f"📊 리포지토리 정보:")
        print(f"   - 이름: {repo.name}")
        print(f"   - 소유자: {repo.owner.login}")
        print(f"   - 권한: {repo.permissions}")
        
        return True
    except Exception as e:
        print(f"❌ GitHub 토큰 테스트 실패: {e}")
        return False

def main():
    print("🚀 BOJ 문제 크롤링 시작")
    
    # GitHub Token 확인
    if not GITHUB_TOKEN:
        print("❌ GITHUB_TOKEN 환경변수가 설정되지 않았습니다")
        return
    
    # GitHub 토큰 권한 테스트
    print("\n🔍 GitHub 토큰 권한 확인 중...")
    if not test_github_token():
        print("❌ GitHub 토큰에 문제가 있습니다. 토큰 권한을 확인해주세요.")
        return
    
    problem_ids = read_problem_ids()
    if not problem_ids:
        print("❌ 처리할 문제 ID가 없습니다")
        return
    
    print(f"📋 총 {len(problem_ids)}개 문제를 처리합니다: {problem_ids}")
    
    success_count = 0
    for problem_id in problem_ids:
        print(f"\n🔄 문제 {problem_id} 처리 중...")
        
        # 문제 크롤링 (BOJ 직접 크롤링 시도)
        content = fetch_problem(problem_id)
        
        # BOJ 크롤링 실패시 solved.ac API 사용
        if not content:
            print(f"🔄 solved.ac API로 재시도...")
            content = fetch_problem_from_solved_ac(problem_id)
            
        if not content:
            print(f"❌ 모든 방법 실패 - 문제 {problem_id} 건너뜀")
            continue
            
        # GitHub에 업로드
        if upload_to_github(problem_id, content):
            success_count += 1
        
        # 자연스러운 요청 간격
        time.sleep(random.uniform(3, 7))
    
    print(f"\n🎉 완료! {success_count}/{len(problem_ids)}개 문제 처리 성공")

if __name__ == "__main__":
    main()