/**
 * AI API 호출 모듈
 * 외부 AI 서비스(OpenAI, Google Gemini)와의 통신을 담당합니다.
 */

/**
 * AI API 호출 메인 함수
 * @param {string} userMessage - 사용자 입력 메시지
 * @param {Object} conversationState - 대화 상태 객체
 * @param {Object} session - 세션 정보
 * @param {Object} analysis - 감정 분석 결과
 * @param {Object} keywords - 추출된 키워드
 * @param {boolean} isTest - 테스트 모드 여부
 * @returns {Promise<string>} AI 응답
 */
async function callAIAPI(userMessage, conversationState, session, analysis, keywords, isTest = false) {
    const provider = window.chatbot?.aiConfig?.provider || 'local';
    
    if (provider === 'local') {
        return generateLocalResponse(userMessage, conversationState, analysis, keywords);
    }
    
    try {
        if (provider === 'openai') {
            return await callOpenAI(userMessage, conversationState, session, analysis, keywords, isTest);
        } else if (provider === 'google') {
            return await callGoogleGemini(userMessage, conversationState, session, analysis, keywords, isTest);
        }
    } catch (error) {
        console.error('AI API 호출 실패:', error);
        // API 실패 시 로컬 모델로 폴백
        return generateLocalResponse(userMessage, conversationState, analysis, keywords);
    }
}

/**
 * OpenAI GPT API 호출
 */
async function callOpenAI(userMessage, conversationState, session, analysis, keywords, isTest = false) {
    const apiKey = window.chatbot?.aiConfig?.apiKey;
    
    if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다');
    }
    
    // 테스트 모드
    if (isTest) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: '테스트' }],
                max_tokens: 50
            })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return '연결 성공';
    }

    // 위기 상황 감지
    const isUrgent = detectUrgency(userMessage);
    
    // 시스템 프롬프트와 유저 프롬프트 생성
    const systemPrompt = isUrgent 
        ? buildCrisisInterventionPrompt(userMessage)
        : buildSystemPrompt(conversationState, session);
    
    const userPrompt = buildUserPrompt(userMessage, conversationState, analysis, keywords);
    
    // 대화 컨텍스트 구성 (최근 3개 대화만)
    const messages = [
        { role: 'system', content: systemPrompt }
    ];
    
    // 최근 대화 추가 (너무 길어지지 않도록 제한)
    const recentHistory = conversationState.conversationHistory.slice(-3);
    recentHistory.forEach(conv => {
        messages.push({ role: 'user', content: conv.input });
        if (conv.response) {
            messages.push({ role: 'assistant', content: conv.response });
        }
    });
    
    // 현재 메시지 추가
    messages.push({ role: 'user', content: userPrompt });
    
    // API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini', // 또는 'gpt-4', 'gpt-3.5-turbo'
            messages: messages,
            max_tokens: 800,
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0.3, // 반복 감소
            presence_penalty: 0.3   // 다양성 증가
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

/**
 * Google Gemini API 호출
 */
async function callGoogleGemini(userMessage, conversationState, session, analysis, keywords, isTest = false) {
    const apiKey = window.chatbot?.aiConfig?.apiKey;
    
    if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다');
    }
    
    // 테스트 모드
    if (isTest) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: '테스트' }] }]
            })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return '연결 성공';
    }

    // 위기 상황 감지
    const isUrgent = detectUrgency(userMessage);
    
    // 시스템 프롬프트와 유저 프롬프트 생성
    const systemPrompt = isUrgent 
        ? buildCrisisInterventionPrompt(userMessage)
        : buildSystemPrompt(conversationState, session);
    
    const userPrompt = buildUserPrompt(userMessage, conversationState, analysis, keywords);
    
    // Gemini는 시스템 프롬프트를 별도로 지원하지 않으므로 합쳐서 전송
    const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
    
    // API 호출
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: fullPrompt }]
            }],
            generationConfig: {
                maxOutputTokens: 800,
                temperature: 0.7,
                topP: 0.9,
                topK: 40
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_NONE'
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_NONE'
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_NONE'
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_NONE'
                }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Gemini API returned no candidates');
    }
    
    return data.candidates[0].content.parts[0].text.trim();
}

/**
 * 대화 분석 요청
 */
async function requestConversationAnalysis(conversationHistory) {
    const provider = window.chatbot?.aiConfig?.provider || 'local';
    
    if (provider === 'local') {
        // 로컬 모드에서는 간단한 통계만 제공
        return generateLocalAnalysis(conversationHistory);
    }
    
    const apiKey = window.chatbot?.aiConfig?.apiKey;
    if (!apiKey) {
        return generateLocalAnalysis(conversationHistory);
    }
    
    const analysisPrompt = buildConversationAnalysisPrompt(conversationHistory);
    
    try {
        if (provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: '당신은 전문 심리상담 분석가입니다.' },
                        { role: 'user', content: analysisPrompt }
                    ],
                    max_tokens: 1000,
                    temperature: 0.5
                })
            });
            
            if (!response.ok) throw new Error('Analysis request failed');
            
            const data = await response.json();
            return data.choices[0].message.content;
        } else if (provider === 'google') {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: analysisPrompt }] }],
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.5
                    }
                })
            });
            
            if (!response.ok) throw new Error('Analysis request failed');
            
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        }
    } catch (error) {
        console.error('Analysis request failed:', error);
        return generateLocalAnalysis(conversationHistory);
    }
}

/**
 * 로컬 분석 생성 (AI 없이)
 */
function generateLocalAnalysis(conversationHistory) {
    // utils.js의 기존 분석 함수 활용
    const emotionPatterns = conversationHistory
        .filter(c => c.analysis)
        .map(c => c.analysis.sentiment);
    
    const emotionalTrend = analyzeEmotionalTrend(emotionPatterns);
    
    const allKeywords = {};
    conversationHistory.forEach(conv => {
        if (conv.keywords) {
            Object.keys(conv.keywords).forEach(category => {
                allKeywords[category] = (allKeywords[category] || 0) + 1;
            });
        }
    });
    
    const sortedKeywords = Object.entries(allKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    let analysis = `## 주요 발견사항\n\n`;
    
    if (sortedKeywords.length > 0) {
        analysis += `가장 자주 언급된 주제는 "${CATEGORY_NAMES[sortedKeywords[0][0]]}"입니다 (${sortedKeywords[0][1]}회).\n\n`;
    }
    
    analysis += `## 감정 패턴\n\n${emotionalTrend}\n\n`;
    
    analysis += `## 권장사항\n\n`;
    analysis += `- 지속적인 자기 관찰과 감정 인식\n`;
    analysis += `- 필요시 전문가 상담 고려\n`;
    analysis += `- 규칙적인 자기 돌봄 실천\n`;
    
    return analysis;
}