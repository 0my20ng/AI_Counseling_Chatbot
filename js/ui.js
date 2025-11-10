/**
 * UI 렌더링 모듈
 * DOM 조작 및 메시지 표시를 담당합니다.
 */

/**
 * 사용자 메시지를 화면에 추가
 * @param {HTMLElement} container - 채팅 컨테이너
 * @param {string} message - 메시지 내용
 */
function addUserMessage(container, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        <div class="avatar user-avatar">👤</div>
        <div class="message-bubble">${escapeHtml(message)}</div>
    `;
    container.appendChild(messageDiv);
    scrollToBottom(container);
}

/**
 * 봇 메시지를 화면에 추가
 * @param {HTMLElement} container - 채팅 컨테이너
 * @param {string} message - 메시지 내용
 * @param {Array} quickResponses - 빠른 응답 버튼 배열 (선택사항)
 */
function addBotMessage(container, message, quickResponses = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    
    let quickResponsesHtml = '';
    if (quickResponses.length > 0) {
        quickResponsesHtml = `
            <div class="quick-responses">
                ${quickResponses.map(response => 
                    `<div class="quick-response" onclick="chatbot.selectQuickResponse('${response.replace(/'/g, "\\'")}')">${escapeHtml(response)}</div>`
                ).join('')}
            </div>
        `;
    }

    messageDiv.innerHTML = `
        <div class="avatar bot-avatar">🤖</div>
        <div class="message-bubble">
            ${escapeHtml(message).replace(/\n/g, '<br>')}
            ${quickResponsesHtml}
        </div>
    `;
    container.appendChild(messageDiv);
    scrollToBottom(container);
}

/**
 * 시스템 메시지 추가
 * @param {HTMLElement} container - 채팅 컨테이너
 * @param {string} message - 메시지 내용
 */
function addSystemMessage(container, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.innerHTML = `
        <div class="avatar system-avatar">📢</div>
        <div class="message-bubble">${escapeHtml(message)}</div>
    `;
    container.appendChild(messageDiv);
    scrollToBottom(container);
}

/**
 * 평가 질문 UI 생성
 * @param {HTMLElement} container - 채팅 컨테이너
 * @param {string} question - 질문 내용
 * @param {number} currentNum - 현재 질문 번호
 * @param {number} totalNum - 전체 질문 개수
 * @param {string} assessmentName - 평가 도구 이름
 */
function addAssessmentQuestion(container, question, currentNum, totalNum, assessmentName) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'message bot';
    
    questionDiv.innerHTML = `
        <div class="avatar bot-avatar">📋</div>
        <div class="message-bubble">
            <div class="assessment-card">
                <div class="assessment-header">
                    <div class="question-number">${currentNum}/${totalNum}</div>
                    <div class="assessment-type">${assessmentName}</div>
                </div>
                <div class="question-text">${escapeHtml(question)}</div>
                <div class="rating-scale">
                    ${Object.entries(SCALE_DESCRIPTIONS).map(([score, desc]) => `
                        <div class="rating-option" onclick="chatbot.selectRating(${score})">
                            <span class="rating-number">${score}</span>
                            <span>${escapeHtml(desc)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(questionDiv);
    scrollToBottom(container);
}

/**
 * 감정 분석 결과 표시
 * @param {HTMLElement} container - 채팅 컨테이너
 * @param {Object} keywords - 추출된 키워드
 * @param {Object} analysis - 감정 분석 결과
 */
function showEmotionAnalysis(container, keywords, analysis) {
    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'emotion-analysis';
    
    let keywordHtml = '';
    if (Object.keys(keywords).length > 0) {
        keywordHtml = `
            <div class="keyword-analysis">
                <h4>🔍 감지된 키워드</h4>
                <div class="keyword-tags">
                    ${Object.keys(keywords).map(category => 
                        `<span class="keyword-tag">${escapeHtml(CATEGORY_NAMES[category] || category)}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    const sentimentText = analysis.sentiment === 'positive' ? '긍정적' : 
                         analysis.sentiment === 'negative' ? '부정적' : '중립적';

    analysisDiv.innerHTML = `
        <h4>💭 감정 분석 결과</h4>
        <div class="emotion-item">
            <span>전반적 감정</span>
            <span>${sentimentText}</span>
        </div>
        ${keywordHtml}
    `;
    
    container.appendChild(analysisDiv);
    scrollToBottom(container);
}

/**
 * 대화 분석 결과 표시
 * @param {HTMLElement} container - 채팅 컨테이너
 * @param {Array} conversationHistory - 대화 기록
 * @param {string} analysisText - 분석 텍스트 (AI 생성 또는 로컬 분석)
 */
function showConversationAnalysis(container, conversationHistory, analysisText) {
    // 키워드 빈도 분석
    const keywordFrequency = {};
    conversationHistory.forEach(conv => {
        Object.keys(conv.keywords || {}).forEach(category => {
            keywordFrequency[category] = (keywordFrequency[category] || 0) + 1;
        });
    });

    const sortedKeywords = Object.entries(keywordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'message bot';
    
    analysisDiv.innerHTML = `
        <div class="avatar bot-avatar">📊</div>
        <div class="message-bubble">
            <div class="summary-card">
                <div class="summary-header">
                    <h3>📊 종합 대화 분석</h3>
                </div>
                
                <h4>🔍 주요 관심사 (${conversationHistory.length}회 대화 기준):</h4>
                ${sortedKeywords.length > 0 ? sortedKeywords.map(([category, count]) => 
                    `<div class="emotion-item">
                        <span>${escapeHtml(CATEGORY_NAMES[category] || category)}</span>
                        <span>${count}회 언급</span>
                    </div>`
                ).join('') : '<p>특별한 패턴이 감지되지 않았습니다.</p>'}
                
                <h4 style="margin-top: 15px;">💡 분석 결과:</h4>
                <div style="white-space: pre-wrap; padding: 10px 0;">
                    ${escapeHtml(analysisText)}
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(analysisDiv);
    scrollToBottom(container);
}

/**
 * 평가 결과 요약 표시
 * @param {HTMLElement} container - 채팅 컨테이너
 * @param {string} assessmentType - 평가 유형
 * @param {number} totalScore - 총점
 * @param {string} interpretation - 해석
 * @param {string} recommendationsHtml - 권장사항 HTML
 */
function showAssessmentSummary(container, assessmentType, totalScore, interpretation, recommendationsHtml) {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'message bot';
    
    summaryDiv.innerHTML = `
        <div class="avatar bot-avatar">📋</div>
        <div class="message-bubble">
            <div class="summary-card">
                <div class="summary-header">
                    <h3>📊 평가 결과 및 분석</h3>
                </div>
                
                <div class="score-display">
                    <div class="score-number">${totalScore}</div>
                    <div class="score-interpretation">${escapeHtml(ASSESSMENT_DATA[assessmentType].name)}</div>
                    <div style="margin-top: 10px; font-weight: 600; color: #7b1fa2;">
                        해석: ${escapeHtml(interpretation)}
                    </div>
                </div>

                <div class="recommendations">
                    <h4>💡 권장사항</h4>
                    ${recommendationsHtml}
                </div>

                <div style="margin-top: 20px; padding: 15px; background: rgba(33, 150, 243, 0.1); border-radius: 10px;">
                    <h4 style="color: #1976d2; margin-bottom: 10px;">📚 전문 기관 연락처</h4>
                    <div class="recommendation-item">
                        <div class="recommendation-icon">📞</div>
                        <div>
                            <strong>정신건강복지센터:</strong> 1577-0199<br>
                            <strong>생명의전화:</strong> 1393<br>
                            <strong>청소년전화:</strong> 1388
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(summaryDiv);
    scrollToBottom(container);
}

/**
 * 타이핑 인디케이터 표시
 * @param {HTMLElement} container - 채팅 컨테이너
 */
function showTypingIndicator(container) {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-message';
    typingDiv.innerHTML = `
        <div class="avatar bot-avatar">🤖</div>
        <div class="message-bubble">
            <div class="typing-indicator">
                <span>AI 상담사가 분석 중</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    container.appendChild(typingDiv);
    scrollToBottom(container);
}

/**
 * 타이핑 인디케이터 제거
 * @param {HTMLElement} container - 채팅 컨테이너
 */
function removeTypingIndicator(container) {
    const typingMessage = container.querySelector('.typing-message');
    if (typingMessage) {
        typingMessage.remove();
    }
}

/**
 * 환영 화면 숨기기
 * @param {HTMLElement} welcomeScreen - 환영 화면 요소
 */
function hideWelcomeScreen(welcomeScreen) {
    welcomeScreen.style.display = 'none';
}

/**
 * 채팅 컨테이너를 맨 아래로 스크롤
 * @param {HTMLElement} container - 채팅 컨테이너
 */
function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
}

/**
 * 입력 필드 자동 높이 조절
 * @param {HTMLElement} textarea - textarea 요소
 */
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

/**
 * 입력 필드 초기화
 * @param {HTMLElement} textarea - textarea 요소
 */
function resetTextarea(textarea) {
    textarea.value = '';
    textarea.style.height = 'auto';
}

/**
 * 모드 선택 카드 선택 효과
 * @param {string} mode - 선택된 모드
 */
function highlightModeCard(mode) {
    const cards = document.querySelectorAll('.mode-card');
    cards.forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`.mode-card[onclick*="${mode}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
}

/**
 * 로딩 스피너 표시
 * @param {HTMLElement} button - 버튼 요소
 * @param {boolean} show - 표시 여부
 */
function toggleLoadingSpinner(button, show) {
    if (show) {
        button.disabled = true;
        button.innerHTML = '⏳';
    } else {
        button.disabled = false;
        button.innerHTML = '➤';
    }
}

/**
 * 에러 메시지 표시
 * @param {HTMLElement} container - 채팅 컨테이너
 * @param {string} errorMessage - 에러 메시지
 */
function showErrorMessage(container, errorMessage) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message system';
    errorDiv.innerHTML = `
        <div class="avatar system-avatar">⚠️</div>
        <div class="message-bubble" style="background: #fee; border: 1px solid #fcc;">
            <strong>오류 발생:</strong> ${escapeHtml(errorMessage)}
        </div>
    `;
    container.appendChild(errorDiv);
    scrollToBottom(container);
}

/**
 * 위기 상황 경고 메시지 표시
 * @param {HTMLElement} container - 채팅 컨테이너
 */
function showCrisisAlert(container) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'message system';
    alertDiv.innerHTML = `
        <div class="avatar system-avatar">🆘</div>
        <div class="message-bubble" style="background: linear-gradient(135deg, #fee 0%, #fdd 100%); border: 2px solid #f00;">
            <strong style="color: #c00; font-size: 16px;">🆘 긴급 상황 감지</strong><br><br>
            지금 매우 힘든 상황에 계신 것 같습니다.<br>
            전문가의 즉각적인 도움을 받으시기 바랍니다.<br><br>
            <div style="background: white; padding: 10px; border-radius: 8px; margin-top: 10px;">
                📞 <strong>긴급 연락처:</strong><br>
                • 생명의전화: 1393 (24시간)<br>
                • 청소년전화: 1388<br>
                • 정신건강위기상담: 1577-0199<br>
                • 응급상황: 119
            </div>
        </div>
    `;
    container.appendChild(alertDiv);
    scrollToBottom(container);
}

/**
 * 개인정보 보호 안내 표시
 * @param {HTMLElement} container - 채팅 컨테이너
 */
function showPrivacyNotice(container) {
    const noticeDiv = document.createElement('div');
    noticeDiv.className = 'privacy-notice';
    noticeDiv.innerHTML = `
        🔒 <strong>개인정보 보호</strong>: 모든 대화는 익명화되어 임시 저장되며, 상담 종료 시 자동 삭제됩니다.
    `;
    container.insertBefore(noticeDiv, container.firstChild);
}

/**
 * 평가 진행률 표시
 * @param {HTMLElement} container - 채팅 컨테이너
 * @param {number} current - 현재 진행
 * @param {number} total - 전체 개수
 */
function updateAssessmentProgress(container, current, total) {
    const progressDiv = document.createElement('div');
    progressDiv.className = 'assessment-progress';
    progressDiv.innerHTML = `
        <div style="text-align: center; padding: 10px; background: rgba(79, 172, 254, 0.1); border-radius: 8px; margin: 10px 0;">
            <strong>진행률:</strong> ${current}/${total} (${Math.round(current/total*100)}%)
            <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-top: 5px; overflow: hidden;">
                <div style="width: ${current/total*100}%; height: 100%; background: linear-gradient(90deg, #4facfe, #00f2fe); transition: width 0.3s ease;"></div>
            </div>
        </div>
    `;
    container.appendChild(progressDiv);
    scrollToBottom(container);
}