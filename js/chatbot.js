/**
 * 향상된 AI 상담 챗봇 클래스
 * 메인 챗봇 로직을 담당하는 클래스
 */
class EnhancedAICounselingChatbot {
    constructor() {
        // DOM 요소들 참조
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.sessionIdElement = document.getElementById('sessionId');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.apiStatus = document.getElementById('apiStatus');
        
        // AI 설정
        this.aiConfig = {
            provider: 'local',
            apiKey: null,
            isConnected: false
        };
        
        // 세션 관리
        this.session = {
            id: generateSessionId(),
            responses: [],
            scores: {},
            emotionalProfile: {},
            conversationSummary: '',
            createdAt: new Date().toISOString(),
            mode: null
        };
        
        // 대화 상태 관리
        this.conversationState = {
            phase: 'greeting',
            currentAssessmentType: null,
            currentQuestionIndex: 0,
            conversationHistory: [],
            emotionalThemes: new Set(),
            keyProblems: []
        };
        
        this.isTyping = false;
        this.recentResponses = [];
        
        this.initializeSession();
        this.initializeEventListeners();
        this.loadSavedConfig();
    }

    /**
     * 세션 초기화
     */
    initializeSession() {
        this.sessionIdElement.textContent = `세션: ${this.session.id}`;
        console.log('익명 세션 시작:', this.session.id);
    }

    /**
     * 이벤트 리스너 초기화
     */
    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });
    }

    /**
     * 설정 패널 토글
     */
    toggleSettings() {
        this.settingsPanel.classList.toggle('show');
    }

    /**
     * API 설정 저장
     */
    async saveApiConfig() {
        const provider = document.getElementById('aiProvider').value;
        const apiKey = document.getElementById('apiKey').value;
        
        this.aiConfig.provider = provider;
        this.aiConfig.apiKey = apiKey || null;
        
        localStorage.setItem('aiProvider', provider);
        if (apiKey) {
            sessionStorage.setItem('apiKey', apiKey);
        }
        
        await this.testApiConnection();
    }

    /**
     * 저장된 설정 로드
     */
    loadSavedConfig() {
        const savedProvider = localStorage.getItem('aiProvider');
        const savedApiKey = sessionStorage.getItem('apiKey');
        
        if (savedProvider) {
            document.getElementById('aiProvider').value = savedProvider;
            this.aiConfig.provider = savedProvider;
        }
        
        if (savedApiKey) {
            document.getElementById('apiKey').value = savedApiKey;
            this.aiConfig.apiKey = savedApiKey;
            this.testApiConnection();
        }
    }

    /**
     * API 연결 테스트
     */
    async testApiConnection() {
        const statusElement = this.apiStatus;
        
        try {
            statusElement.className = 'api-status';
            statusElement.textContent = '연결 테스트 중...';
            
            if (this.aiConfig.provider === 'local') {
                this.aiConfig.isConnected = true;
                statusElement.className = 'api-status connected';
                statusElement.textContent = '✅ 로컬 모델 사용 (무료, 제한적 성능)';
                return;
            }
            
            if (!this.aiConfig.apiKey) {
                statusElement.className = 'api-status error';
                statusElement.textContent = '❌ API 키가 필요합니다';
                return;
            }
            
            const testResponse = await this.callAIAPI("안녕하세요", true);
            
            if (testResponse) {
                this.aiConfig.isConnected = true;
                statusElement.className = 'api-status connected';
                statusElement.textContent = `✅ ${this.aiConfig.provider.toUpperCase()} 연결 성공`;
            } else {
                throw new Error('API 응답 없음');
            }
            
        } catch (error) {
            this.aiConfig.isConnected = false;
            statusElement.className = 'api-status error';
            statusElement.textContent = `❌ 연결 실패: ${error.message}`;
        }
    }

    /**
     * 상담 모드 선택 처리
     */
    selectMode(mode) {
        this.session.mode = mode;
        this.conversationState.phase = 'conversation';
        
        this.welcomeScreen.style.display = 'none';
        
        if (mode === 'conversation') {
            this.addSystemMessage("💬 자유 대화 상담 모드를 선택하셨습니다.");
            this.addBotMessage(
                "안녕하세요! 편안한 마음으로 현재 상황이나 고민을 자유롭게 말씀해주세요. " +
                "필요하다면 언제든 표준 심리검사를 제안드릴 수 있습니다.",
                ["기분이 좋지 않아요", "요즘 힘든 일이 많아요", "스트레스를 많이 받고 있어요", "누군가와 이야기하고 싶어요"]
            );
        } else {
            this.addSystemMessage("📋 표준 심리검사 모드를 선택하셨습니다.");
            this.addBotMessage(
                "어떤 문제로 검사를 받고 싶으신지 간단히 말씀해주세요. " +
                "적절한 표준화된 심리검사를 추천해드리겠습니다.",
                ["우울감이 지속되고 있어요", "불안하고 걱정이 많아요", "스트레스가 심해요", "전반적으로 힘들어요"]
            );
        }
    }

    /**
     * 메시지 전송 처리
     */
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        this.addUserMessage(message);
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.sendButton.disabled = true;

        await this.processResponse(message);
        this.sendButton.disabled = false;
    }

    /**
     * 응답 처리 및 다음 단계 결정
     */

    async provideFinalAnalysisAndEnd() {
        this.addSystemMessage("상담을 종료하기 전, 전체 대화 내용을 바탕으로 '초기 진단' 요약을 제공해 드립니다.");

        // 1. 마지막 분석을 요청
        await this.provideConversationAnalysis(); 

        // 2. (잠시 후) 진짜 종료
        setTimeout(() => {
            this.endConversation();
        }, 1500);
    }

    async processResponse(userInput) {
        // 특수 명령어 처리
        if (userInput.toLowerCase().includes('검사') || userInput.toLowerCase().includes('평가')) {
            if (this.session.mode === 'conversation') {
                this.addSystemMessage("📋 표준 심리검사로 전환합니다.");
                this.session.mode = 'assessment';
                this.determineAssessmentPath(userInput);
                return;
            }
        } else if (userInput.toLowerCase().includes('분석') && this.conversationState.conversationHistory.length > 0) {
            this.provideConversationAnalysis();
            return;
        } else if (userInput.toLowerCase().includes('종료')) {
            // this.endConversation();
            this.provideFinalAnalysisAndEnd();
            return;
        }

        // 감정 및 키워드 분석
        const analysis = analyzeSentimentAndEmotion(userInput);
        const keywords = extractKeywords(userInput);
        
        // 대화 기록에 추가
        this.conversationState.conversationHistory.push({
            input: anonymizeText(userInput),
            analysis: analysis,
            keywords: keywords,
            timestamp: new Date().toISOString()
        });

        // 감정 테마 업데이트
        Object.keys(keywords).forEach(theme => {
            this.conversationState.emotionalThemes.add(theme);
        });

        // 타이핑 인디케이터 표시
        this.showTypingIndicator();

        try {
            // AI 응답 생성
            const aiResponse = await this.callAIAPI(userInput);
            
            this.removeTypingIndicator();
            
            // 응답을 대화 기록에 추가
            if (this.conversationState.conversationHistory.length > 0) {
                this.conversationState.conversationHistory[this.conversationState.conversationHistory.length - 1].response = aiResponse;
            }
            
            this.addBotMessage(aiResponse);
            
            // 감정 분석 결과 표시
            if (Object.keys(keywords).length > 0) {
                setTimeout(() => {
                    this.showEmotionAnalysis(keywords, analysis);
                }, 1000);
            }
            
            // 위험 상황 감지
            this.checkForRiskFactors(userInput, keywords);
            
            // 정기적 분석 제공
            if (this.conversationState.conversationHistory.length % 5 === 0) {
                setTimeout(() => {
                    this.addSystemMessage("📊 대화 분석을 제공합니다.");
                    this.provideConversationAnalysis();
                }, 2000);
            }
            
            // 검사 제안
            this.suggestAssessmentIfNeeded(keywords);
            
        } catch (error) {
            this.removeTypingIndicator();
            this.addBotMessage("죄송합니다. 일시적인 문제가 발생했습니다. 다시 말씀해주시겠어요?");
            console.error('응답 생성 오류:', error);
        }
    }

    /**
     * 시스템 프롬프트 구성
     */
    buildSystemPrompt() {
        return `당신은 전문적인 심리상담사입니다. 다음 지침을 따라주세요:

1. 공감적이고 따뜻한 톤으로 응답하세요
2. 내담자의 감정을 인정하고 검증해주세요
3. 판단하지 말고 경청하는 자세를 유지하세요
4. 적절한 질문을 통해 더 깊은 탐색을 도와주세요
5. 전문적 치료가 필요하다고 판단되면 권유하세요
6. 자해나 자살 위험이 감지되면 즉시 전문기관 연락을 권하세요
7. 응답은 3-5문장으로 간결하게 작성하세요

현재 상담 모드: ${this.session.mode || '대화형 상담'}
주요 감정 테마: ${Array.from(this.conversationState.emotionalThemes).join(', ') || '분석 중'}`;
    }

    /**
     * 대화 컨텍스트 구성
     */
    buildConversationContext() {
        const context = [];
        const recentHistory = this.conversationState.conversationHistory.slice(-6);
        
        recentHistory.forEach(conv => {
            context.push({ role: 'user', content: conv.input });
            if (conv.response) {
                context.push({ role: 'assistant', content: conv.response });
            }
        });
        
        return context;
    }

    /**
     * AI API 호출 (새로운 프롬프트 시스템 사용)
     */
    async callAIAPI(userInput) {
        const analysis = analyzeSentimentAndEmotion(userInput);
        const keywords = extractKeywords(userInput);
        
        return await callAIAPI(
            userInput,
            this.conversationState,
            this.session,
            analysis,
            keywords,
            false
        );
    }

    /**
     * 위험 요소 감지 및 대응
     */
    checkForRiskFactors(userInput, keywords) {
        const riskKeywords = ['죽고싶', '자살', '자해', '끝내고싶', '사라지고싶', '더이상', '포기'];
        const hasRiskKeywords = riskKeywords.some(keyword => userInput.toLowerCase().includes(keyword));
        
        if (hasRiskKeywords) {
            setTimeout(() => {
                this.addSystemMessage("🆘 긴급 상황 감지");
                this.addBotMessage(
                    "지금 매우 힘든 상황에 계신 것 같습니다. 혼자서 이 모든 것을 감당하지 마세요. " +
                    "전문가의 도움을 받으실 것을 강력히 권합니다.\n\n" +
                    "• 생명의전화: 1393 (24시간)\n" +
                    "• 청소년전화: 1388\n" +
                    "• 정신건강위기상담전화: 1577-0199\n\n" +
                    "당신의 생명은 소중합니다."
                );
            }, 500);
        }
    }

    /**
     * 검사 제안 로직
     */
    suggestAssessmentIfNeeded(keywords) {
        const keywordCounts = {};
        
        this.conversationState.conversationHistory.forEach(conv => {
            Object.keys(conv.keywords || {}).forEach(category => {
                keywordCounts[category] = (keywordCounts[category] || 0) + 1;
            });
        });
        
        Object.entries(keywordCounts).forEach(([category, count]) => {
            if (count >= 3 && this.session.mode === 'conversation') {
                setTimeout(() => {
                    let assessmentName = '';
                    
                    if (category === 'depression') {
                        assessmentName = 'PHQ-9 우울증 선별검사';
                    } else if (category === 'anxiety') {
                        assessmentName = 'GAD-7 불안장애 선별검사';
                    } else if (category === 'stress') {
                        assessmentName = '지각된 스트레스 척도(PSS)';
                    }
                    
                    if (assessmentName) {
                        this.addBotMessage(
                            `대화를 통해 ${CATEGORY_NAMES[category]} 내용이 지속적으로 나타나고 있습니다. ` +
                            `보다 정확한 평가를 위해 ${assessmentName}를 받아보시는 것은 어떨까요?`,
                            ["네, 검사를 받아보겠습니다", "아니요, 대화를 계속하겠습니다"]
                        );
                    }
                }, 1500);
            }
        });
    }

    /**
     * 평가 경로 결정
     */
    determineAssessmentPath(userInput) {
        const userLower = userInput.toLowerCase();
        
        if (KEYWORD_PATTERNS.depression.some(keyword => userLower.includes(keyword))) {
            this.conversationState.currentAssessmentType = 'phq9';
            this.addSystemMessage("🔍 우울감과 관련된 내용이 감지되었습니다.");
        } else if (KEYWORD_PATTERNS.anxiety.some(keyword => userLower.includes(keyword))) {
            this.conversationState.currentAssessmentType = 'gad7';
            this.addSystemMessage("🔍 불안감과 관련된 내용이 감지되었습니다.");
        } else {
            this.conversationState.currentAssessmentType = 'stress';
            this.addSystemMessage("🔍 전반적인 스트레스 평가를 진행하겠습니다.");
        }

        const assessmentName = ASSESSMENT_DATA[this.conversationState.currentAssessmentType].name;
        this.addBotMessage(`${assessmentName}를 진행하겠습니다. 각 질문에 솔직하게 답변해주세요.`);

        this.conversationState.phase = 'assessment';
        this.conversationState.currentQuestionIndex = 0;
        this.session.scores[this.conversationState.currentAssessmentType] = [];
        
        setTimeout(() => this.askNextAssessmentQuestion(), 1000);
    }

    /**
     * 다음 평가 질문 제시
     */
    askNextAssessmentQuestion() {
        const assessmentType = this.conversationState.currentAssessmentType;
        const questions = ASSESSMENT_DATA[assessmentType].questions;
        const currentIndex = this.conversationState.currentQuestionIndex;
        
        if (currentIndex < questions.length) {
            this.addAssessmentQuestion(
                questions[currentIndex],
                currentIndex + 1,
                questions.length,
                ASSESSMENT_DATA[assessmentType].name
            );
        } else {
            this.conversationState.phase = 'summary';
            setTimeout(() => this.provideSummaryAndRecommendations(), 1000);
        }
    }

    /**
     * 평가 점수 선택 처리
     */
    selectRating(score) {
        const currentQuestionCard = event.target.closest('.assessment-card');
        if (!currentQuestionCard || currentQuestionCard.classList.contains('completed')) {
            return;
        }
        
        const options = currentQuestionCard.querySelectorAll('.rating-option');
        
        options.forEach(option => option.classList.remove('selected'));
        event.target.closest('.rating-option').classList.add('selected');
        
        currentQuestionCard.classList.add('completed');
        options.forEach(option => {
            option.style.pointerEvents = 'none';
            option.style.opacity = '0.6';
        });
        
        event.target.closest('.rating-option').style.opacity = '1';
        
        const assessmentType = this.conversationState.currentAssessmentType;
        this.session.scores[assessmentType].push(score);
        
        this.conversationState.currentQuestionIndex++;
        setTimeout(() => this.askNextAssessmentQuestion(), 500);
    }

    /**
     * 결과 요약 및 권장사항 제공
     */
    provideSummaryAndRecommendations() {
        const assessmentType = this.conversationState.currentAssessmentType;
        const scores = this.session.scores[assessmentType];
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const interpretation = interpretScore(totalScore, assessmentType);
        
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
                        <div class="score-interpretation">${ASSESSMENT_DATA[assessmentType].name}</div>
                        <div style="margin-top: 10px; font-weight: 600; color: #7b1fa2;">
                            해석: ${interpretation}
                        </div>
                    </div>

                    <div class="recommendations">
                        <h4>💡 권장사항</h4>
                        ${this.generateRecommendations(totalScore, assessmentType)}
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
        
        this.chatContainer.appendChild(summaryDiv);
        this.scrollToBottom();

        setTimeout(() => {
            this.addBotMessage(
                "검사 결과를 바탕으로 추가 상담을 계속하시거나, 다른 검사를 받아보실 수 있습니다.",
                ["대화 상담을 계속하겠습니다", "다른 검사도 받아보고 싶어요", "상담을 종료하겠습니다"]
            );
            this.conversationState.phase = 'conversation';
            this.session.mode = 'conversation';
        }, 1000);
    }

    /**
     * 맞춤형 권장사항 생성
     */
    generateRecommendations(score, assessmentType) {
        let recommendations = '';

        if (assessmentType === 'phq9' && score >= 10) {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">🏥</div>
                    <div>
                        <strong>중등도 이상의 우울감이 감지되었습니다.</strong><br>
                        전문적인 상담이나 치료를 받으시는 것을 권장드립니다.
                    </div>
                </div>
            `;
        } else if (assessmentType === 'gad7' && score >= 10) {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">😰</div>
                    <div>
                        <strong>중등도 이상의 불안감이 감지되었습니다.</strong><br>
                        이완 기법, 규칙적인 운동, 전문 상담을 고려해보세요.
                    </div>
                </div>
            `;
        } else {
            recommendations = `
                <div class="recommendation-item">
                    <div class="recommendation-icon">🌱</div>
                    <div><strong>규칙적인 생활 리듬 유지</strong></div>
                </div>
                <div class="recommendation-item">
                    <div class="recommendation-icon">🏃</div>
                    <div><strong>적절한 운동과 휴식</strong></div>
                </div>
                <div class="recommendation-item">
                    <div class="recommendation-icon">👥</div>
                    <div><strong>사회적 지지체계 활용</strong></div>
                </div>
            `;
        }

        return recommendations;
    }

    /**
     * 감정 분석 결과 표시
     */
    showEmotionAnalysis(keywords, analysis) {
        const analysisDiv = document.createElement('div');
        analysisDiv.className = 'emotion-analysis';
        
        let keywordHtml = '';
        if (Object.keys(keywords).length > 0) {
            keywordHtml = `
                <div class="keyword-analysis">
                    <h4>🔍 감지된 키워드</h4>
                    <div class="keyword-tags">
                        ${Object.keys(keywords).map(category => 
                            `<span class="keyword-tag">${CATEGORY_NAMES[category] || category}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        analysisDiv.innerHTML = `
            <h4>💭 감정 분석 결과</h4>
            <div class="emotion-item">
                <span>전반적 감정</span>
                <span>${analysis.sentiment === 'positive' ? '긍정적' : analysis.sentiment === 'negative' ? '부정적' : '중립적'}</span>
            </div>
            ${keywordHtml}
        `;
        
        this.chatContainer.appendChild(analysisDiv);
        this.scrollToBottom();
    }

    /**
     * 대화 분석 제공
     */
    async provideConversationAnalysis() {
        if (this.conversationState.conversationHistory.length === 0) {
            this.addBotMessage("아직 분석할 대화 내용이 충분하지 않습니다.");
            return;
        }

        const analysisText = await requestConversationAnalysis(this.conversationState.conversationHistory);
        
        const analysisDiv = document.createElement('div');
        analysisDiv.className = 'message bot';
        analysisDiv.innerHTML = `
            <div class="avatar bot-avatar">📊</div>
            <div class="message-bubble">
                <div class="summary-card">
                    <div class="summary-header">
                        <h3>📊 종합 대화 분석</h3>
                    </div>
                    <div style="white-space: pre-wrap;">${escapeHtml(analysisText)}</div>
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(analysisDiv);
        this.scrollToBottom();
    }

    /**
     * 사용자 메시지 추가
     */
    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="avatar user-avatar">👤</div>
            <div class="message-bubble">${escapeHtml(message)}</div>
        `;
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * 봇 메시지 추가
     */
    addBotMessage(message, quickResponses = []) {
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
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * 시스템 메시지 추가
     */
    addSystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.innerHTML = `
            <div class="avatar system-avatar">📢</div>
            <div class="message-bubble">${escapeHtml(message)}</div>
        `;
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * 평가 질문 UI 생성
     */
    addAssessmentQuestion(question, currentNum, totalNum, assessmentName) {
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
                    <div class="question-text">${question}</div>
                    <div class="rating-scale">
                        ${Object.entries(SCALE_DESCRIPTIONS).map(([score, desc]) => `
                            <div class="rating-option" onclick="chatbot.selectRating(${score})">
                                <span class="rating-number">${score}</span>
                                <span>${desc}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(questionDiv);
        this.scrollToBottom();
    }

    /**
     * 빠른 응답 선택
     */
    selectQuickResponse(response) {
        this.messageInput.value = response;
        this.sendMessage();
    }

    /**
     * 타이핑 인디케이터 표시
     */
    showTypingIndicator() {
        this.isTyping = true;
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
        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    /**
     * 타이핑 인디케이터 제거
     */
    removeTypingIndicator() {
        this.isTyping = false;
        const typingMessage = this.chatContainer.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    /**
     * 상담 종료 처리
     */
    endConversation() {
        this.addSystemMessage("상담을 종료합니다.");
        this.addBotMessage(
            "🙏 상담에 참여해주셔서 감사합니다.\n" +
            "🔒 모든 대화 기록이 안전하게 삭제됩니다.\n" +
            "💚 언제든 다시 도움이 필요하시면 페이지를 새로고침해서 새로운 상담을 시작하세요."
        );
        
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
        
        setTimeout(() => {
            this.session = null;
            console.log('세션 데이터가 안전하게 삭제되었습니다.');
        }, 2000);
    }

    /**
     * 채팅 컨테이너를 맨 아래로 스크롤
     */
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
}