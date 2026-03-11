const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  try {
    // 1. PR 정보 가져오기 (GitHub Actions가 제공하는 이벤트 파일 읽기)
    const eventPath = process.env.GITHUB_EVENT_PATH;
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    const prNumber = eventData.pull_request ? eventData.pull_request.number : null;
    const repo = process.env.GITHUB_REPOSITORY;

    if (!prNumber) {
      console.log("PR 환경이 아닙니다. 댓글 작성을 건너뜁니다.");
      return;
    }

    // 2. 가짜 리뷰 결과 (나중에 진짜 AI로 교체할 부분)
    const mockReview = `
        ### 🤖 AI Code Reviewer의 분석 결과
        사용자님, PR을 검토했습니다! 4.3 학점다운 깔끔한 코드를 지향해 봅시다.

        - **발견된 문제**: \`page.tsx\`에서 타입 불일치가 의심됩니다.
        - **제안**: TypeScript 인터페이스를 더 구체화해 보세요.
        - **네트워크**: 불필요한 API 호출이 없는지 확인 바랍니다.
    `;

    // 3. GitHub API로 댓글 전송
    const token = process.env.GITHUB_TOKEN; // .yml에서 주입받을 예정
    const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;

    console.log(`--- PR #${prNumber}에 댓글을 작성 중 ---`);

    await axios.post(url, { body: mockReview }, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    console.log("✅ 댓글 작성이 완료되었습니다!");

  } catch (error) {
    console.error("❌ 댓글 작성 실패:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

main();