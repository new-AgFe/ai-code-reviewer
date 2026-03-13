import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import fs from 'fs';
import { execSync } from 'child_process';

async function main() {
    try {
        // 1. 인자로 받은 타겟 경로 (기본값은 현재 폴더 '.')
        const targetPath = process.argv[2] || '.'; 
        
        // 2. git diff 추출 (origin/main 대신 자동으로 기본 브랜치와 비교하게 하거나 명시)
        // -C 옵션으로 해당 폴더 내의 변경사항을 정확히 캡처합니다.
        const diff = execSync(`git -C ${targetPath} diff origin/main HEAD`).toString();

        // 3. GitHub 이벤트 데이터 읽기 (이건 targetPath와 상관없이 환경변수 경로 사용)
        const eventPath = process.env.GITHUB_EVENT_PATH; 
        const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
        
        const prNumber = eventData.pull_request?.number;
        const repo = process.env.GITHUB_REPOSITORY; // 이건 현재 Actions가 실행되는 레포 이름

        if (!diff || !prNumber) {
            console.log("리뷰할 변경 사항이 없거나 PR 정보가 없습니다.");
            return;
        }

        // 2. Gemini 설정 (최신 문법)
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `너는 아주 깐깐한 시니어 개발자야. 다음 코드 변경 사항(diff)에 대해 3줄 요약 리뷰를 반드시 한국어로 답변해줘 말투는 전공자 선배처럼 해줘. \n\n${diff}`,
        });

        // 3. 응답 텍스트 추출 (깃허브 예시: response.text)
        const reviewContent = response.text;

        const githubToken = process.env.GITHUB_TOKEN;
        await axios.post(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, 
            { body: `### 🤖 Gemini AI 사수의 진짜 리뷰\n\n${reviewContent}` },
            { headers: { 'Authorization': `token ${githubToken}` } }
        );

        console.log("✅ 드디어 성공했습니다!");

    } catch (error) {
        console.error("❌ 에러 상세 내용:", error);
        process.exit(1);
    }
}

main();