const axios = require('axios');
const { execSync } = require('child_process');

async function main() {
  try {
    // 1. 마지막 커밋의 변경 사항(diff) 가져오기
    // HEAD~1과 HEAD 사이의 차이점을 추출합니다.
    const diff = execSync('git diff HEAD~1 HEAD').toString();

    if (!diff) {
      console.log("변경 사항이 없습니다.");
      return;
    }

    console.log("--- 변경된 코드 분석 중 ---");

    // 2. OpenAI API 호출
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o", // 혹은 사용 가능한 모델명
      messages: [
        { 
          role: "system", 
          content: "너는 소프트웨어 공학 전공자 수준의 깐깐한 코드 리뷰어다. 특히 TypeScript의 타입 안정성과 네트워크 성능 최적화 관점에서 코드를 비판적으로 리뷰해라. 한국어로 답변해줘." 
        },
        { 
          role: "user", 
          content: `다음 코드 변경 사항을 리뷰해줘:\n\n${diff}` 
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 3. 결과 출력
    console.log("\n🚀 AI 사수의 리뷰 결과:");
    console.log(response.data.choices[0].message.content);

  } catch (error) {
    console.error("❌ 리뷰 도중 에러 발생:");
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

main();