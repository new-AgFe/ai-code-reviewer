import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import fs from 'fs';
import { execSync } from 'child_process';

async function main() {
    try {
        // 1. 환경 변수 및 변경 사항 가져오기
        const diff = execSync('git diff origin/main HEAD').toString();
        const eventPath = process.env.GITHUB_EVENT_PATH;
        const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
        const prNumber = eventData.pull_request.number;
        const repo = process.env.GITHUB_REPOSITORY;

        if (!diff) return;

        // 2. Gemini 설정 (최신 문법)
        const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
        
        // 모델 선언 시 API 버전을 명시하지 않고 가장 기본형으로 선언
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `너는 아주 깐깐한 시니어 개발자야. 다음 코드 변경 사항(diff)에 대해 3줄 요약 리뷰를 남겨줘. \n\n${diff}`;

        console.log("--- Gemini AI에게 분석 요청 중 ---");
        
        // generateContent는 비동기 함수이므로 await를 꼭 확인하세요.
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const reviewContent = response.text();

        // 3. GitHub에 댓글 달기
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