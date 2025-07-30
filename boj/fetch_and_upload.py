import requests
from bs4 import BeautifulSoup
from github import Github
import base64
import os

GITHUB_TOKEN = os.environ['GITHUB_TOKEN']
REPO_NAME = "SSAFYstudyAlgoPoolja/problem-box"
PROBLEMS_PATH = "problems"

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
"""