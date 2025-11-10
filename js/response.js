/**
 * 로컬 응답 생성 모듈
 * AI API 없이 패턴 기반으로 응답을 생성합니다.
 */

/**
 * 로컬 응답 생성 메인 함수
 */
function generateLocalResponse(userMessage, conversationState, analysis, keywords) {
    const conversationCount = conversationState.conversationHistory.length;
    const phase = determineConversationPhase(conversationCount);
    const context = analyzeConversationContext(userMessage, conversationCount, conversationState);
    const dominantCategory = getDominantEmotionCategory(keywords);
    
    // 응답 템플릿 가져오기
    const responseTemplates = getResponseTemplates();
    const situationalResponses = getSituationalResponses();
    
    // 응답 선택
    const selectedResponse = selectContextualResponse(
        dominantCategory,
        phase,
        context,
        responseTemplates,
        situationalResponses
    );
    
    // 후속 질문 생성
    const followUpQuestion = generateContextualFollowUp(
        dominantCategory,
        phase,
        context,
        conversationCount
    );
    
    // 지지 메시지 (30% 확률)
    const supportMessage = Math.random() > 0.7 ? generateSupportMessage(context, conversationCount) : '';
    
    // 최종 응답 조합
    let finalResponse = selectedResponse;
    if (followUpQuestion) {
        finalResponse += ' ' + followUpQuestion;
    }
    if (supportMessage) {
        finalResponse += ' ' + supportMessage;
    }
    
    return finalResponse;
}

/**
 * 응답 템플릿 정의
 */
function getResponseTemplates() {
    return {
        depression: {
            opening: [
                "마음이 많이 무거우신 것 같아요. 이런 감정을 표현해주셔서 고맙습니다.",
                "힘든 시간을 보내고 계시는군요. 그런 마음을 느끼는 것 자체가 용기있는 일이에요.",
                "우울한 감정이 지속되고 있는 것 같아요. 혼자 견뎌내려 하지 마세요."
            ],
            middle: [
                "이런 감정이 언제부터 시작되었는지 기억나시나요?",
                "우울감이 하루 중 언제 가장 심하게 느껴지시나요?",
                "지금까지 이런 기분을 극복해보려고 어떤 노력들을 해보셨나요?"
            ],
            deep: [
                "이런 감정들이 일상생활에 어떤 영향을 미치고 있나요?",
                "혹시 전문적인 도움을 받아보는 것에 대해 어떻게 생각하시나요?",
                "지금 당장 가장 필요하다고 느끼는 것이 있다면 무엇일까요?"
            ]
        },
        anxiety: {
            opening: [
                "불안한 마음이 크게 느껴지고 계시는군요. 그런 감정을 인정하는 것부터 시작이에요.",
                "걱정이 많으신 것 같아요. 마음이 편하지 않으시죠?",
                "긴장되고 예민해지는 마음이 느껴져요. 몸도 함께 긴장되어 있으실 것 같아요."
            ],
            middle: [
                "어떤 상황이나 생각이 불안감을 더 크게 만드시나요?",
                "불안할 때 몸에서 느껴지는 증상들이 있나요?",
                "밤에 잠들기 어려우시거나 자꾸 깨시는 일이 있나요?"
            ],
            deep: [
                "가장 두려워하시는 것이 실제로 일어날 가능성은 얼마나 된다고 생각하세요?",
                "불안할 때 도움이 되는 호흡법이나 이완 방법을 시도해보신 적이 있나요?",
                "이런 불안감을 전문가와 상담해보는 것에 대해서는 어떻게 생각하세요?"
            ]
        },
        stress: {
            opening: [
                "많은 스트레스를 받고 계시는 것 같아요. 정말 힘드셨을 것 같아요.",
                "압박감이 상당히 크게 느껴지시는군요. 어깨가 무거우실 것 같아요.",
                "여러 가지 일들이 한꺼번에 몰려와서 부담스러우신 것 같아요."
            ],
            middle: [
                "현재 가장 큰 스트레스 요인이 무엇인가요?",
                "스트레스 때문에 몸에 나타나는 증상들이 있나요?",
                "이런 상황이 얼마나 지속되었나요?"
            ],
            deep: [
                "지금 상황에서 가장 우선순위를 두어야 할 것들을 정리해보셨나요?",
                "완벽하게 하려고 하시는 성향이 스트레스를 더 키우고 있지는 않나요?",
                "전문적인 스트레스 관리 기법을 배워보는 것은 어떨까요?"
            ]
        },
        anger: {
            opening: [
                "화가 많이 나셨군요. 그런 감정을 느끼는 것도 자연스러운 반응이에요.",
                "분노가 치밀어 오르고 계시는 것 같아요. 억울하고 답답하시죠?",
                "정말 화가 나실 만한 상황이었을 것 같아요."
            ],
            middle: [
                "어떤 상황에서 가장 화가 나시나요?",
                "화가 날 때 몸에서 어떤 변화를 느끼시나요?",
                "이런 분노감이 자주 생기시나요?"
            ],
            deep: [
                "이런 분노의 밑바탕에는 어떤 감정이 숨어있다고 생각하세요?",
                "화를 건강하게 표현하거나 해소하는 방법을 찾아보셨나요?",
                "분노 때문에 중요한 관계들이 영향을 받고 있지는 않나요?"
            ]
        },
        general: {
            opening: [
                "지금 마음이 어떠신지 잘 들어보겠습니다. 편하게 말씀해주세요.",
                "현재 상황이 쉽지 않으신 것 같아요. 어떤 부분이 가장 힘드신가요?",
                "말씀해주신 내용을 통해 많은 고민이 있으시다는 걸 느낄 수 있어요."
            ],
            middle: [
                "이런 상황에서 가장 우선적으로 해결하고 싶은 것이 있나요?",
                "비슷한 어려움을 겪어본 적이 있으신가요?",
                "주변에서 도움을 받을 수 있는 사람이 있나요?"
            ],
            deep: [
                "지금까지의 대화를 통해 어떤 통찰이나 깨달음이 있으셨나요?",
                "앞으로 어떤 방향으로 나아가고 싶으신가요?",
                "지금 가장 필요한 것이 무엇이라고 생각하시나요?"
            ]
        }
    };
}

/**
 * 상황별 특수 응답
 */
function getSituationalResponses() {
    return {
        crisis: [
            "지금 정말 힘든 순간을 보내고 계시는군요. 이런 감정을 느끼는 것 자체가 용기 있는 일이에요.",
            "극도로 어려운 상황에 계시는 것 같아요. 혼자서 견뎌내려 하지 마시고 도움을 요청하세요."
        ],
        improvement: [
            "조금씩 나아지고 계시는 것 같아서 다행이에요. 그 변화를 인정해주세요.",
            "긍정적인 변화가 느껴져요. 지금까지의 노력들이 결실을 맺고 있는 것 같아요."
        ],
        confusion: [
            "지금 마음이 많이 복잡하고 혼란스러우신 것 같아요. 그런 감정도 자연스러워요.",
            "여러 감정이 뒤엉켜 있어서 정리가 안 되시는 것 같아요. 천천히 하나씩 풀어보죠."
        ]
    };
}

/**
 * 대화 맥락 분석
 */
function analyzeConversationContext(userMessage, conversationCount, conversationState) {
    return {
        intensity: analyzeEmotionalIntensity(userMessage),
        urgency: detectUrgency(userMessage),
        progress: detectProgress(userMessage),
        confusion: detectConfusion(userMessage),
        repetition: detectRepetition(userMessage, conversationCount, conversationState),
        length: userMessage.length > 100 ? 'long' : userMessage.length > 30 ? 'medium' : 'short'
    };
}

/**
 * 반복 패턴 감지
 */
function detectRepetition(message, conversationCount, conversationState) {
    if (conversationCount < 3) return false;
    
    const recentHistory = conversationState.conversationHistory.slice(-3);
    const currentKeywords = extractKeywords(message);
    
    return recentHistory.some(conv => {
        const prevKeywords = conv.keywords || {};
        return Object.keys(currentKeywords).some(category => 
            prevKeywords.hasOwnProperty(category)
        );
    });
}

/**
 * 맥락에 맞는 응답 선택
 */
function selectContextualResponse(category, phase, context, responses, situationalResponses) {
    // 위기 상황 우선
    if (context.urgency) {
        return getRandomResponse(situationalResponses.crisis);
    }
    
    // 진전
    if (context.progress) {
        return getRandomResponse(situationalResponses.improvement);
    }
    
    // 혼란
    if (context.confusion) {
        return getRandomResponse(situationalResponses.confusion);
    }
    
    // 일반
    const categoryResponses = responses[category] || responses.general;
    const phaseResponses = categoryResponses[phase] || categoryResponses.opening;
    
    return getRandomResponse(phaseResponses);
}

/**
 * 맥락에 맞는 후속 질문 생성
 */
function generateContextualFollowUp(category, phase, context, conversationCount) {
    if (context.repetition) {
        return getRandomResponse([
            "다른 관점에서 이 문제를 바라볼 수 있을까요?",
            "혹시 아직 말씀하지 않으신 중요한 부분이 있나요?"
        ]);
    }
    
    if (context.intensity === 'high') {
        return getRandomResponse([
            "지금 가장 급하게 해결해야 할 것이 무엇일까요?",
            "이런 강한 감정을 느끼게 된 구체적인 상황이 있나요?"
        ]);
    }
    
    const phaseQuestions = {
        opening: [
            "이런 상황이 얼마나 지속되었나요?",
            "언제부터 이런 감정을 느끼기 시작하셨나요?"
        ],
        middle: [
            "이 문제가 일상생활에 어떤 영향을 미치고 있나요?",
            "비슷한 경험을 해본 적이 있으신가요?"
        ],
        deep: [
            "지금까지 대화를 통해 새롭게 깨달은 것이 있나요?",
            "앞으로 어떤 방향으로 나아가고 싶으신가요?"
        ]
    };
    
    return getRandomResponse(phaseQuestions[phase] || phaseQuestions.opening);
}

/**
 * 지지 메시지 생성
 */
function generateSupportMessage(context, conversationCount) {
    const messages = [
        "당신의 용기에 박수를 보내드리고 싶어요.",
        "이렇게 솔직하게 표현해주셔서 정말 감사합니다.",
        "혼자가 아니라는 것을 기억해주세요.",
        "지금까지 잘 견뎌내고 계세요."
    ];
    
    if (conversationCount > 5) {
        messages.push(
            "지금까지의 대화를 통해 당신의 진정성이 느껴져요.",
            "함께 이 여정을 걸어가고 있다고 생각해주세요."
        );
    }
    
    return getRandomResponse(messages);
}

/**
 * 랜덤 응답 선택 (중복 방지)
 */
let recentResponses = [];

function getRandomResponse(responseArray) {
    if (!responseArray || responseArray.length === 0) {
        return "말씀해주신 내용을 깊이 이해하려고 노력하고 있어요.";
    }
    
    const availableResponses = responseArray.filter(response => 
        !recentResponses.includes(response)
    );
    
    const selectedResponse = availableResponses.length > 0
        ? availableResponses[Math.floor(Math.random() * availableResponses.length)]
        : responseArray[Math.floor(Math.random() * responseArray.length)];
    
    recentResponses.push(selectedResponse);
    if (recentResponses.length > 3) {
        recentResponses.shift();
    }
    
    return selectedResponse;
}