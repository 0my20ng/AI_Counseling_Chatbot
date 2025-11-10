/**
 * 심리검사 모듈
 * 표준화된 심리검사(PHQ-9, GAD-7, PSS) 관련 로직을 담당합니다.
 */

/**
 * 평가 경로 결정
 * @param {string} userInput - 사용자 입력
 * @returns {string} 평가 유형 (phq9, gad7, stress)
 */
function determineAssessmentType(userInput) {
    const userLower = userInput.toLowerCase();
    
    // 우울증 관련 키워드
    if (KEYWORD_PATTERNS.depression.some(keyword => userLower.includes(keyword))) {
        return 'phq9';
    }
    
    // 불안 관련 키워드
    if (KEYWORD_PATTERNS.anxiety.some(keyword => userLower.includes(keyword))) {
        return 'gad7';
    }
    
    // 기본값: 스트레스
    return 'stress';
}

/**
 * 평가 시작
 * @param {Object} chatbot - 챗봇 인스턴스
 * @param {string} userInput - 사용자 입력
 */
function startAssessment(chatbot, userInput) {
    const assessmentType = determineAssessmentType(userInput);
    
    chatbot.conversationState.currentAssessmentType = assessmentType;
    chatbot.conversationState.phase = 'assessment';
    chatbot.conversationState.currentQuestionIndex = 0;
    chatbot.session.scores[assessmentType] = [];
    
    // 시스템 메시지
    const typeMessages = {
        'phq9': '🔍 우울감과 관련된 내용이 감지되었습니다.',
        'gad7': '🔍 불안감과 관련된 내용이 감지되었습니다.',
        'stress': '🔍 전반적인 스트레스 평가를 진행하겠습니다.'
    };
    
    addSystemMessage(chatbot.chatContainer, typeMessages[assessmentType]);
    
    // 안내 메시지
    const assessmentName = ASSESSMENT_DATA[assessmentType].name;
    addBotMessage(
        chatbot.chatContainer,
        `${assessmentName}를 진행하겠습니다. 각 질문에 솔직하게 답변해주세요. 정답은 없으며, 지난 2주간 당신이 느낀 그대로 응답하시면 됩니다.`
    );
    
    // 첫 질문 표시
    setTimeout(() => {
        askNextQuestion(chatbot);
    }, 1000);
}

/**
 * 다음 질문 표시
 * @param {Object} chatbot - 챗봇 인스턴스
 */
function askNextQuestion(chatbot) {
    const assessmentType = chatbot.conversationState.currentAssessmentType;
    const questions = ASSESSMENT_DATA[assessmentType].questions;
    const currentIndex = chatbot.conversationState.currentQuestionIndex;
    
    if (currentIndex < questions.length) {
        // 진행률 표시 (3문항마다)
        if (currentIndex > 0 && currentIndex % 3 === 0) {
            updateAssessmentProgress(
                chatbot.chatContainer,
                currentIndex,
                questions.length
            );
        }
        
        // 질문 표시
        addAssessmentQuestion(
            chatbot.chatContainer,
            questions[currentIndex],
            currentIndex + 1,
            questions.length,
            ASSESSMENT_DATA[assessmentType].name
        );
    } else {
        // 검사 완료
        completeAssessment(chatbot);
    }
}

/**
 * 응답 처리
 * @param {Object} chatbot - 챗봇 인스턴스
 * @param {number} score - 선택된 점수
 */
function handleAssessmentResponse(chatbot, score) {
    const assessmentType = chatbot.conversationState.currentAssessmentType;
    
    // 점수 저장
    chatbot.session.scores[assessmentType].push(score);
    
    // 다음 질문으로
    chatbot.conversationState.currentQuestionIndex++;
    
    setTimeout(() => {
        askNextQuestion(chatbot);
    }, 500);
}

/**
 * 검사 완료 및 결과 제공
 * @param {Object} chatbot - 챗봇 인스턴스
 */
function completeAssessment(chatbot) {
    const assessmentType = chatbot.conversationState.currentAssessmentType;
    const scores = chatbot.session.scores[assessmentType];
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const interpretation = interpretScore(totalScore, assessmentType);
    
    // 완료 메시지
    addSystemMessage(chatbot.chatContainer, '✅ 검사가 완료되었습니다. 결과를 분석하고 있습니다...');
    
    // 타이핑 인디케이터
    showTypingIndicator(chatbot.chatContainer);
    
    setTimeout(() => {
        removeTypingIndicator(chatbot.chatContainer);
        
        // 권장사항 생성
        const recommendationsHtml = generateRecommendations(totalScore, assessmentType);
        
        // 결과 표시
        showAssessmentSummary(
            chatbot.chatContainer,
            assessmentType,
            totalScore,
            interpretation,
            recommendationsHtml
        );
        
        // 세부 분석 제공
        setTimeout(() => {
            provideDetailedAnalysis(chatbot, totalScore, scores, assessmentType);
        }, 1000);
        
        // 후속 옵션 제공
        setTimeout(() => {
            addBotMessage(
                chatbot.chatContainer,
                '검사 결과를 바탕으로 추가 상담을 계속하시거나, 다른 검사를 받아보실 수 있습니다. 어떻게 도와드릴까요?',
                ['대화 상담을 계속하겠습니다', '다른 검사도 받아보고 싶어요', '결과에 대해 더 알고 싶어요', '상담을 종료하겠습니다']
            );
            chatbot.conversationState.phase = 'conversation';
            chatbot.session.mode = 'conversation';
        }, 2000);
    }, 1500);
}

/**
 * 권장사항 HTML 생성
 * @param {number} score - 총점
 * @param {string} assessmentType - 평가 유형
 * @returns {string} HTML 문자열
 */
function generateRecommendations(score, assessmentType) {
    let recommendations = '';
    
    // PHQ-9 우울증 검사
    if (assessmentType === 'phq9') {
        if (score >= 20) {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">🚨</div>
                    <div>
                        <strong>심한 우울감이 감지되었습니다.</strong><br>
                        즉시 정신건강의학과 전문의 상담을 받으시기를 강력히 권장합니다.
                    </div>
                </div>
                <div class="recommendation-item">
                    <div class="recommendation-icon">🏥</div>
                    <div>
                        <strong>전문 치료가 필요합니다.</strong><br>
                        약물치료와 심리치료를 병행하는 것이 효과적일 수 있습니다.
                    </div>
                </div>
            `;
        } else if (score >= 15) {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">⚠️</div>
                    <div>
                        <strong>중등도-심한 우울감이 감지되었습니다.</strong><br>
                        전문가 상담을 받으시는 것이 좋습니다.
                    </div>
                </div>
                <div class="recommendation-item">
                    <div class="recommendation-icon">💊</div>
                    <div>
                        <strong>치료 고려:</strong> 심리치료나 약물치료가 도움이 될 수 있습니다.
                    </div>
                </div>
            `;
        } else if (score >= 10) {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">🏥</div>
                    <div>
                        <strong>중등도 우울감이 감지되었습니다.</strong><br>
                        상담이나 치료를 받아보시는 것을 권장합니다.
                    </div>
                </div>
            `;
        } else if (score >= 5) {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">📊</div>
                    <div>
                        <strong>경미한 우울감이 있습니다.</strong><br>
                        자가 관리와 함께 경과를 관찰해보세요.
                    </div>
                </div>
            `;
        } else {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">✅</div>
                    <div>
                        <strong>우울증 증상이 최소 수준입니다.</strong><br>
                        현재 상태를 잘 유지하시면 됩니다.
                    </div>
                </div>
            `;
        }
    }
    
    // GAD-7 불안장애 검사
    else if (assessmentType === 'gad7') {
        if (score >= 15) {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">🚨</div>
                    <div>
                        <strong>심한 불안감이 감지되었습니다.</strong><br>
                        전문가 상담을 강력히 권장합니다.
                    </div>
                </div>
            `;
        } else if (score >= 10) {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">😰</div>
                    <div>
                        <strong>중등도 불안감이 감지되었습니다.</strong><br>
                        이완 기법, 규칙적인 운동, 전문 상담을 고려해보세요.
                    </div>
                </div>
            `;
        } else if (score >= 5) {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">😟</div>
                    <div>
                        <strong>경미한 불안감이 있습니다.</strong><br>
                        스트레스 관리와 자기 돌봄이 도움이 될 수 있습니다.
                    </div>
                </div>
            `;
        } else {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">✅</div>
                    <div>
                        <strong>불안 증상이 최소 수준입니다.</strong><br>
                        현재 상태를 잘 유지하세요.
                    </div>
                </div>
            `;
        }
    }
    
    // PSS 스트레스 검사
    else if (assessmentType === 'stress') {
        if (score >= 27) {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">🔥</div>
                    <div>
                        <strong>높은 스트레스 수준입니다.</strong><br>
                        즉각적인 스트레스 관리가 필요합니다.
                    </div>
                </div>
            `;
        } else if (score >= 14) {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">⚖️</div>
                    <div>
                        <strong>보통 수준의 스트레스입니다.</strong><br>
                        적절한 휴식과 스트레스 관리 기법이 도움이 됩니다.
                    </div>
                </div>
            `;
        } else {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">😌</div>
                    <div>
                        <strong>낮은 스트레스 수준입니다.</strong><br>
                        현재의 스트레스 대처 방식을 잘 유지하세요.
                    </div>
                </div>
            `;
        }
    }
    
    // 공통 권장사항 추가
    recommendations += `
        <div class="recommendation-item">
            <div class="recommendation-icon">🌱</div>
            <div><strong>규칙적인 생활 리듬 유지</strong></div>
        </div>
        <div class="recommendation-item">
            <div class="recommendation-icon">🏃</div>
            <div><strong>적절한 운동과 신체 활동</strong></div>
        </div>
        <div class="recommendation-item">
            <div class="recommendation-icon">👥</div>
            <div><strong>사회적 지지체계 활용</strong></div>
        </div>
        <div class="recommendation-item">
            <div class="recommendation-icon">💬</div>
            <div><strong>필요시 전문가 상담 받기</strong></div>
        </div>
    `;
    
    return recommendations;
}

/**
 * 세부 분석 제공
 * @param {Object} chatbot - 챗봇 인스턴스
 * @param {number} totalScore - 총점
 * @param {Array} scores - 개별 점수 배열
 * @param {string} assessmentType - 평가 유형
 */
function provideDetailedAnalysis(chatbot, totalScore, scores, assessmentType) {
    // 높은 점수(3점) 항목 찾기
    const highScoreItems = [];
    scores.forEach((score, index) => {
        if (score === 3) {
            highScoreItems.push(index + 1);
        }
    });
    
    let analysisText = '## 세부 분석\n\n';
    
    if (highScoreItems.length > 0) {
        analysisText += `특히 다음 항목들에서 높은 점수를 보이셨습니다:\n`;
        highScoreItems.forEach(itemNum => {
            const question = ASSESSMENT_DATA[assessmentType].questions[itemNum - 1];
            analysisText += `\n• 항목 ${itemNum}: "${question.substring(0, 50)}..."\n`;
        });
        analysisText += '\n이러한 증상들이 일상생활에 영향을 미치고 있다면, 전문가와 상담하는 것이 도움이 될 수 있습니다.\n';
    } else {
        analysisText += '전반적으로 균형잡힌 응답을 보이셨습니다. 현재 상태를 잘 유지하시되, 변화가 있다면 다시 평가해보시는 것을 권장합니다.\n';
    }
    
    // 추세 분석 (이전 검사 결과가 있다면)
    if (chatbot.session.scores[assessmentType + '_previous']) {
        const previousScore = chatbot.session.scores[assessmentType + '_previous'];
        const difference = totalScore - previousScore;
        
        analysisText += '\n## 변화 추이\n\n';
        if (difference > 0) {
            analysisText += `⚠️ 이전 검사 대비 ${difference}점 증가했습니다. 증상이 악화되고 있을 수 있으니 주의가 필요합니다.\n`;
        } else if (difference < 0) {
            analysisText += `✅ 이전 검사 대비 ${Math.abs(difference)}점 감소했습니다. 긍정적인 변화가 보이고 있습니다.\n`;
        } else {
            analysisText += `유사한 수준을 유지하고 있습니다.\n`;
        }
    }
    
    // 현재 점수를 이전 점수로 저장
    chatbot.session.scores[assessmentType + '_previous'] = totalScore;
    
    addBotMessage(chatbot.chatContainer, analysisText);
}

/**
 * 검사 제안 로직
 * @param {Object} chatbot - 챗봇 인스턴스
 * @param {Object} keywords - 추출된 키워드
 */
function suggestAssessmentIfNeeded(chatbot, keywords) {
    const keywordCounts = {};
    
    // 대화 기록에서 키워드 빈도 계산
    chatbot.conversationState.conversationHistory.forEach(conv => {
        Object.keys(conv.keywords || {}).forEach(category => {
            keywordCounts[category] = (keywordCounts[category] || 0) + 1;
        });
    });
    
    // 특정 카테고리가 3회 이상 나타나면 검사 제안
    Object.entries(keywordCounts).forEach(([category, count]) => {
        if (count >= 3 && chatbot.session.mode === 'conversation') {
            let assessmentName = '';
            
            if (category === 'depression') {
                assessmentName = 'PHQ-9 우울증 선별검사';
            } else if (category === 'anxiety') {
                assessmentName = 'GAD-7 불안장애 선별검사';
            } else if (category === 'stress') {
                assessmentName = '지각된 스트레스 척도(PSS)';
            }
            
            if (assessmentName) {
                setTimeout(() => {
                    addBotMessage(
                        chatbot.chatContainer,
                        `대화를 통해 ${CATEGORY_NAMES[category]} 내용이 지속적으로 나타나고 있습니다. ` +
                        `보다 정확한 평가를 위해 ${assessmentName}를 받아보시는 것은 어떨까요?`,
                        ['네, 검사를 받아보겠습니다', '아니요, 대화를 계속하겠습니다', '나중에 받아보겠습니다']
                    );
                }, 1500);
            }
        }
    });
}

/**
 * 검사 재실시 확인
 * @param {Object} chatbot - 챗봇 인스턴스
 * @param {string} assessmentType - 평가 유형
 * @returns {boolean} 재실시 가능 여부
 */
function canRetakeAssessment(chatbot, assessmentType) {
    const lastTest = chatbot.session.scores[assessmentType + '_timestamp'];
    
    if (!lastTest) return true;
    
    const daysSinceLastTest = (Date.now() - lastTest) / (1000 * 60 * 60 * 24);
    
    // 최소 7일 간격 권장
    if (daysSinceLastTest < 7) {
        addBotMessage(
            chatbot.chatContainer,
            `이 검사는 ${Math.ceil(daysSinceLastTest)}일 전에 실시하셨습니다. ` +
            `신뢰도 있는 결과를 위해 최소 7일 간격을 두고 검사하시는 것을 권장합니다. ` +
            `그래도 진행하시겠습니까?`,
            ['네, 진행하겠습니다', '아니요, 다음에 하겠습니다']
        );
        return false;
    }
    
    return true;
}

/**
 * 검사 타임스탬프 저장
 * @param {Object} chatbot - 챗봇 인스턴스
 * @param {string} assessmentType - 평가 유형
 */
function saveAssessmentTimestamp(chatbot, assessmentType) {
    chatbot.session.scores[assessmentType + '_timestamp'] = Date.now();
}