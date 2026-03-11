// scripts/review.js (Gemini 버전)
const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
    try {
        const diff = execSync('git diff origin/main HEAD').toString(); // main 브랜치와의 차이점
        const eventPath = process.env.GITHUB_EVENT_PATH;
        const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
        const prNumber = eventData.pull_request.number;
        const repo = process.env.GITHUB_REPOSITORY;

        // 1. Gemini API 호출 (무료!)
        const geminiKey = process.env.GEMINI_API_KEY;
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`;

        const prompt = `너는 아주 깐깐한 시니어 개발자야. 다음 코드의 변경 사항(diff)을 보고, 잠재적인 버그나 타입 에러, 성능 최적화가 필요한 부분을 찾아서 3줄 요약 리뷰를 남겨줘. 말투는 전공자 선배처럼 해줘. \n\n${diff}`;

        const aiResponse = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: prompt }] }]
        })

        const reviewContent = aiResponse.data.candidates[0].content.parts[0].text;

        // 2. GitHub에 댓글 달기
        const githubToken = process.env.GITHUB_TOKEN;
        await axios.post(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, 
            { body: `### 🤖 Gemini AI 사수의 코드 리뷰\n\n${reviewContent}` },
            { headers: { 'Authorization': `token ${githubToken}` } }
        );

        console.log("✅ 진짜 AI 리뷰가 완료되었습니다!");
    } catch (error) {
        console.error("실패:", error.response?.data || error.message);
    }
}
main();