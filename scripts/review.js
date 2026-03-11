// scripts/review.js (Gemini 버전)
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
    try {
        // 1. 기초 정보 설정
        const diff = execSync('git diff origin/main HEAD').toString();
        const eventPath = process.env.GITHUB_EVENT_PATH;
        const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
        const prNumber = eventData.pull_request.number;
        const repo = process.env.GITHUB_REPOSITORY;

        if (!diff) return;

        // 2. Gemini 공식 SDK 설정
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const models = await genAI.ListModels();
        console.log("사용 가능한 모델 목록:", models.map(m => m.name));
        
        const model = genAI.getGenerativeModel(
            { model: "gemini-1.5-pro" },
            { apiVersion: 'v1' } // 이 부분을 추가해서 v1beta가 아닌 안정 버전을 타게 합니다.
        );

        const prompt = `너는 아주 깐깐한 시니어 개발자야. 다음 코드 변경 사항(diff)에 대해 3줄 요약 리뷰를 남겨줘. 말투는 전공자 선배처럼 해줘. \n\n${diff}`;

        console.log("--- Gemini AI에게 분석 요청 중 ---");
        const result = await model.generateContent(prompt);
        const reviewContent = result.response.text();

        // 3. GitHub에 댓글 달기 (기존 로직과 동일)
        const githubToken = process.env.GITHUB_TOKEN;
        await axios.post(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, 
            { body: `### 🤖 Gemini AI 사수의 진짜 리뷰\n\n${reviewContent}` },
            { headers: { 'Authorization': `token ${githubToken}` } }
        );

        console.log("✅ 드디어 진짜 AI 리뷰가 완료되었습니다!");

    } catch (error) {
        console.error("❌ 최종 단계 실패:", error.message);
        process.exit(1);
    }
}

main();