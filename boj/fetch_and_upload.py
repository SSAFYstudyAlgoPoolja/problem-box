import requests
from bs4 import BeautifulSoup
from github import Github
import base64
import os

GITHUB_TOKEN = os.environ['GITHUB_TOKEN']
REPO_NAME = "SSAFYstudyAlgoPoolja/problem-box"
PROBLEMS_PATH = "boj/problems"

def fetch_problem(problem_id):
    url = f"https://www.acmicpc.net/problem/{problem_id}"
    res = requests.get(url)
    if res.status_code != 200:
        print(f"❌ 문제 {problem_id} 가져오기 실패")
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

def main():
    print("🚀 BOJ 문제 크롤링 시작")
    
    problem_ids = read_problem_ids()
    if not problem_ids:
        print("❌ 처리할 문제 ID가 없습니다")
        return
    
    print(f"📋 총 {len(problem_ids)}개 문제를 처리합니다: {problem_ids}")
    
    success_count = 0
    for problem_id in problem_ids:
        print(f"\n🔄 문제 {problem_id} 처리 중...")
        
        # 문제 크롤링
        content = fetch_problem(problem_id)
        if not content:
            continue
            
        # GitHub에 업로드
        if upload_to_github(problem_id, content):
            success_count += 1
    
    print(f"\n🎉 완료! {success_count}/{len(problem_ids)}개 문제 처리 성공")

if __name__ == "__main__":
    main()