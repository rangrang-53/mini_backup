// 사용자 답변 분석 페이지 - 데이터 로드 및 초기화
let currentCount = parseInt(localStorage.getItem('currentCount') || '0');
let maxCount = parseInt(localStorage.getItem('maxCount') || '0');
let currentQuestion = localStorage.getItem('currentQuestion') || "질문을 불러올 수 없습니다.";
let currentAnswer = localStorage.getItem('currentAnswer') || "답변을 불러올 수 없습니다.";

// 분석 상태 변수
let isAnalyzing = false;
let analysisResult = null;

// 페이지 초기화 함수
function initializePage() {
  // 초기에는 질문만 표시
  document.getElementById('questionText').innerText = currentQuestion;
  
  // 초기 로딩 상태 설정
  document.getElementById('barFill').style.width = "0%";
  document.getElementById('barValue').innerText = "분석 준비 중...";
  document.getElementById('characterImg').src = "../images/Base.png";
  
  // 답변이 없는 경우 에러 처리
  if (currentAnswer === "답변을 불러올 수 없습니다." || !currentAnswer.trim()) {
    showError("답변 데이터를 불러올 수 없습니다. 다시 시도해주세요.");
    return;
  }
  
  console.log('사용자 답변 분석 시작:', {
    question: currentQuestion,
    answer: currentAnswer,
    count: `${currentCount + 1}/${maxCount}`
  });
}

// 페이지 로드 시 초기화 및 분석 실행
window.onload = async function() {
  initializePage();
  await analyzeUserAnswer();
};

// 에러 표시 함수
function showError(message) {
  document.getElementById('barValue').innerText = "분석 실패";
  document.getElementById('barFill').style.width = "0%";
  document.getElementById('characterImg').src = "../images/Base.png";
  
  // questionText 영역에 에러 메시지 표시
  const questionTextElement = document.getElementById('questionText');
  questionTextElement.innerHTML = `
    <div style="font-size: 1em; color: #e74c3c; font-weight: bold;">
      ⚠️ ${message}
    </div>
  `;
  
  console.error('Error:', message);
}

// 분석 진행 상태 표시 함수
function showAnalysisProgress() {
  document.getElementById('barValue').innerText = "AI 분석 중...";
  document.getElementById('barFill').style.width = "50%";
  document.getElementById('barFill').style.backgroundColor = "#ffa500"; // 주황색으로 로딩 표시
}

// 사용자 답변 분석 함수 (메인 분석 로직)
async function analyzeUserAnswer() {
  if (isAnalyzing) return; // 중복 실행 방지
  
  isAnalyzing = true;
  showAnalysisProgress();
  
  try {
    console.log('🔍 사용자 답변 분석 시작:', currentAnswer);
    
    const response = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: currentAnswer
      })
    });
    
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }
    
    const data = await response.json();
    
    // API 응답 데이터 상세 확인
    console.log('📡 API 응답 전체 데이터:', data);
    console.log('📡 API 응답 - alternative_response:', {
      exists: !!data.alternative_response,
      type: typeof data.alternative_response,
      length: data.alternative_response ? data.alternative_response.length : 0,
      content: data.alternative_response
    });
    
    analysisResult = data;
    
    console.log('✅ 분석 완료:', {
      score: data.score,
      tendency: getTendencyText(data.score),
      hasDetailedAnalysis: !!data.detailed_analysis,
      hasAlternativeResponse: !!data.alternative_response
    });
    
    // 분석 결과 UI 업데이트
    updateAnalysisUI(data);
    
  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error);
    showError("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    isAnalyzing = false;
  }
}

// 분석 결과 UI 업데이트 함수
function updateAnalysisUI(data) {
  const score = data.score;
  
  // 점수에 따른 캐릭터 이미지 및 색상 선택
  const analysisInfo = getAnalysisInfo(score);
  
  // 바 색상을 원래대로 복원
  document.getElementById('barFill').style.backgroundColor = "";
  
  // 애니메이션 효과로 점수 표시
  animateScoreBar(score);
  
  // 캐릭터 이미지 업데이트
  document.getElementById('characterImg').src = analysisInfo.characterImg;
  
  // questionText 영역에 점수와 성향 정보 표시
  updateQuestionTextWithResult(score, analysisInfo);
  
  // 분석 결과를 localStorage에 저장 (디버깅 로그 추가)
  console.log('💾 localStorage 저장 전 데이터 확인:', {
    score: data.score,
    detailed_analysis: data.detailed_analysis ? '있음' : '없음',
    alternative_response: data.alternative_response ? '있음' : '없음',
    alternative_response_length: data.alternative_response ? data.alternative_response.length : 0,
    alternative_response_preview: data.alternative_response ? data.alternative_response.substring(0, 100) + '...' : 'null'
  });
  
  localStorage.setItem('lastAnalysisResult', JSON.stringify(data));
  
  console.log('🎯 분석 결과 UI 업데이트 완료:', {
    score: Math.round(score),
    tendency: analysisInfo.tendency,
    character: analysisInfo.characterImg
  });
}

// questionText 영역에 분석 결과 표시 함수
function updateQuestionTextWithResult(score, analysisInfo) {
  const questionTextElement = document.getElementById('questionText');
  
  // 점수와 성향 정보를 questionText 영역에 표시
  questionTextElement.innerHTML = `
    <div style="font-size: 1.1em; font-weight: bold; color: #333;">
      점수: ${Math.round(score)}점
    </div>
    <div style="font-size: 1em; color: #555; margin-top: 4px;">
      성향: ${analysisInfo.tendency}
    </div>
    <div style="font-size: 0.9em; color: #777; margin-top: 4px;">
      ${analysisInfo.description}
    </div>
  `;
  
  console.log('📝 questionText 영역에 분석 결과 표시:', {
    score: Math.round(score),
    tendency: analysisInfo.tendency
  });
}

// 점수에 따른 분석 정보 반환 함수
function getAnalysisInfo(score) {
  if (score < 20) {
    return {
      characterImg: "../images/Very_angry.png",
      tendency: "매우 강한 T(사고형) 성향",
      description: "논리적이고 객관적인 판단을 매우 선호합니다."
    };
  } else if (score < 40) {
    return {
      characterImg: "../images/Simple_angry.png",
      tendency: "강한 T(사고형) 성향",
      description: "합리적 사고를 중시하는 편입니다."
    };
  } else if (score < 60) {
    return {
      characterImg: "../images/Base.png",
      tendency: "T-F 균형",
      description: "논리와 감정의 균형이 잡혀 있습니다."
    };
  } else if (score < 80) {
    return {
      characterImg: "../images/Simple_happy.png",
      tendency: "F(감정형) 성향",
      description: "감정과 관계를 중시하는 편입니다."
    };
  } else {
    return {
      characterImg: "../images/Very_happy.png",
      tendency: "강한 F(감정형) 성향",
      description: "깊은 공감과 배려심을 가지고 있습니다."
    };
  }
}

// 성향 텍스트 반환 함수
function getTendencyText(score) {
  return getAnalysisInfo(score).tendency;
}

// 점수 바 애니메이션 함수
function animateScoreBar(targetScore) {
  const barFill = document.getElementById('barFill');
  const barValue = document.getElementById('barValue');
  
  let currentScore = 0;
  const increment = targetScore / 30; // 30 프레임으로 애니메이션
  
  const animation = setInterval(() => {
    currentScore += increment;
    
    if (currentScore >= targetScore) {
      currentScore = targetScore;
      clearInterval(animation);
      barValue.innerText = Math.round(currentScore) + "점";
    } else {
      barValue.innerText = Math.round(currentScore) + "점";
    }
    
    barFill.style.width = currentScore + "%";
  }, 50);
}

// 🔍 "자세히 보기" 버튼 이벤트 - 사용자 답변 상세 분석 결과 표시
document.getElementById('reviewBtn').onclick = async function() {
  console.log('📋 상세 분석 모달 열기');
  
  // 분석이 완료되지 않았으면 대기
  if (isAnalyzing) {
    alert('분석이 진행 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }
  
  // 저장된 분석 결과 가져오기
  const savedResult = localStorage.getItem('lastAnalysisResult');
  
  // localStorage 데이터 확인
  console.log('💾 localStorage에서 불러온 데이터:', savedResult);
  
  if (savedResult && analysisResult) {
    const analysisData = JSON.parse(savedResult);
    
    // 파싱된 데이터 확인
    console.log('📊 파싱된 분석 데이터:', analysisData);
    console.log('📊 파싱된 데이터 - alternative_response:', {
      exists: !!analysisData.alternative_response,
      type: typeof analysisData.alternative_response,
      length: analysisData.alternative_response ? analysisData.alternative_response.length : 0,
      content: analysisData.alternative_response
    });
    
    const analysisInfo = getAnalysisInfo(analysisData.score);
    
    // 모달에 사용자 데이터 표시
    document.getElementById('modalQuestion').innerText = `Q: ${currentQuestion}`;
    document.getElementById('modalAnswer').innerText = `A: ${currentAnswer}`;
    
    // 상세 분석 결과 표시
    if (analysisData.detailed_analysis) {
      document.getElementById('modalDetail').innerText = analysisData.detailed_analysis;
    } else {
      // AI 분석이 없으면 기본 분석 결과 표시
      document.getElementById('modalDetail').innerText = 
        `점수: ${Math.round(analysisData.score)}점\n성향: ${analysisInfo.tendency}\n${analysisInfo.description}`;
    }
    
    // F 성향 상대를 위한 실천팁과 대안답변 표시
    await displayFeedbackContent(analysisData);
    
    // 모달 표시
    document.getElementById('reviewDetailModal').style.display = 'flex';
    
    console.log('✅ 상세 분석 모달 표시 완료:', {
      score: Math.round(analysisData.score),
      tendency: analysisInfo.tendency,
      hasAIAnalysis: !!analysisData.detailed_analysis,
      hasAlternativeResponse: !!analysisData.alternative_response
    });
    
  } else {
    // 분석 결과가 없거나 오류인 경우
    console.log('❌ 분석 결과 없음 - 오류 모달 표시');
    showDetailedAnalysisError();
  }
};

// 피드백 콘텐츠 표시 함수
async function displayFeedbackContent(analysisData) {
  console.log('🔍 피드백 콘텐츠 표시 - 원본 데이터:', analysisData);
  
  try {
    // 백엔드에서 F 친화적 응답 가져오기
    const response = await fetch('/generate_f_friendly_response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: currentQuestion,
        answer: currentAnswer,
        score: analysisData.score
      })
    });
    
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🌟 백엔드에서 받은 피드백 데이터:', data);
    
    // 백엔드에서 받은 응답 처리
    const friendlyResponse = data.response || data.friendly_response || "";
    
    // 응답을 줄바꿈으로 분리하여 실천팁과 대안답변 구분
    const parts = friendlyResponse.split('\n\n');
    console.log('📋 파싱된 parts:', parts);
    
    // 첫 번째 부분은 실천팁으로 처리
    const tip = parts[0] || "";
    // 두 번째 부분은 대안답변으로 처리
    const alternative = parts[1] || "";
    
    console.log('💡 실천팁:', tip);
    console.log('🔄 대안답변:', alternative);
    
    // 실천팁 표시
    if (tip.trim()) {
      document.getElementById('modalTip').innerHTML = tip;
      document.getElementById('modalTip').style.display = 'block';
      console.log('✅ 실천팁 표시됨');
    } else {
      document.getElementById('modalTip').style.display = 'none';
      console.log('❌ 실천팁 없음');
    }
    
    // 대안답변 표시
    if (alternative.trim()) {
      document.getElementById('modalAlternative').innerText = alternative;
      document.getElementById('modalAlternative').style.display = 'block';
      console.log('✅ 대안답변 표시됨');
    } else {
      document.getElementById('modalAlternative').style.display = 'none';
      console.log('❌ 대안답변 없음');
    }
    
  } catch (error) {
    console.error('❌ 피드백 데이터 가져오기 실패:', error);
    
    // 오류 발생 시 기본 메시지 표시
    document.getElementById('modalTip').innerHTML = '<span style="color: #ff6600;">피드백을 불러오는 중 오류가 발생했습니다.</span>';
    document.getElementById('modalTip').style.display = 'block';
    document.getElementById('modalAlternative').innerText = '잠시 후 다시 시도해주세요.';
    document.getElementById('modalAlternative').style.display = 'block';
  }
}

// 상세 분석 오류 표시 함수
function showDetailedAnalysisError() {
  document.getElementById('modalQuestion').innerText = currentQuestion;
  document.getElementById('modalAnswer').innerText = currentAnswer;
  document.getElementById('modalDetail').innerText = '⚠️ 분석 결과를 불러올 수 없습니다.\n페이지를 새로고침하거나 다시 시도해주세요.';
  document.getElementById('modalTip').style.display = 'none';
  document.getElementById('modalAlternative').style.display = 'none';
  document.getElementById('reviewDetailModal').style.display = 'flex';
  
  console.warn('❌ 상세 분석 결과 없음 - 오류 모달 표시');
}

// ➡️ "다음" 버튼 이벤트 - 분석 결과 저장 후 다음 단계로 이동
document.getElementById('nextBtn').onclick = function() {
  console.log('➡️ 다음 단계로 이동');
  
  // 분석이 아직 진행 중이면 대기 요청
  if (isAnalyzing) {
    alert('분석이 진행 중입니다. 잠시만 기다려주세요.');
    return;
  }
  
  // 현재 분석 결과를 전체 결과에 추가
  const savedResult = localStorage.getItem('lastAnalysisResult');
  if (savedResult) {
    const analysisData = JSON.parse(savedResult);
    
    // 전체 결과 배열에 추가
    let allResults = JSON.parse(localStorage.getItem('allResults') || '[]');
    allResults.push({
      question: currentQuestion,
      answer: currentAnswer,
      score: analysisData.score
    });
    localStorage.setItem('allResults', JSON.stringify(allResults));
    
    console.log('💾 분석 결과 저장 완료:', {
      totalResults: allResults.length,
      currentScore: Math.round(analysisData.score),
      nextStep: currentCount + 1 < maxCount ? 'next_question' : 'final_result'
    });
  } else {
    console.warn('⚠️ 분석 결과가 없어 저장하지 못했습니다.');
  }
  
  // 다음 문제로 이동 또는 최종 결과 화면으로 이동
  currentCount++;
  localStorage.setItem('currentCount', currentCount);
  
  if (currentCount < maxCount) {
    // 남은 문제가 있으면 문제 화면으로 이동
    console.log(`📝 다음 질문으로 이동 (${currentCount + 1}/${maxCount})`);
    window.location.href = '/static/html/question.html';
  } else {
    // 남은 문제가 없으면 최종 결과 화면으로 이동
    console.log('🎯 모든 질문 완료 - 최종 결과 화면으로 이동');
    window.location.href = '/index2.html';
  }
};

// ❌ 모달 닫기 버튼 이벤트
document.getElementById('modalCloseBtn').onclick = function() {
  document.getElementById('reviewDetailModal').style.display = 'none';
  console.log('📋 상세 분석 모달 닫기');
}; 