/**
 * 유틸리티 함수들
 * 재사용 가능한 헬퍼 함수들을 모아놓은 파일
 */

/**
 * HTML 이스케이프 처리 (XSS 방지)
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 비동기 지연 함수
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 간단한 해시 함수
 */
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

/**
 * 익명 세션 ID 생성
 */
function generateSessionId() {
    const timestamp = Date.now().toString();
    return hashString(timestamp).substring(0, 12);
}

/**
 * 개인정보 익명화 처리
 */
function anonymizeText(text) {
    const patterns = [
        { regex: /\b[가-힣]{2,4}\b(?=\s*(?:님|씨|이|가|은|는))/g, replacement: '[이름]' },
        { regex: /\b\d{2,3}-\d{3,4}-\d{4}\b/g, replacement: '[전화번호]' },
        { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[이메일]' },
        { regex: /\b\d{6}-\d{7}\b/g, replacement: '[주민번호]' }
    ];

    let anonymized = text;
    patterns.forEach(pattern => {
        anonymized = anonymized.replace(pattern.regex, pattern.replacement);
    });
    return anonymized;
}

/**
 * 감정 점수 분석
 */
function analyzeSentiment(text) {
    const positiveWords = ["좋", "행복", "기쁨", "만족", "즐거", "편안", "희망", "사랑"];
    const negativeWords = ["나쁘", "슬프", "화나", "우울", "불안", "걱정", "힘들", "괴로"];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    const textLower = text.toLowerCase();
    positiveWords.forEach(word => {
        if (textLower.includes(word)) positiveScore++;
    });
    negativeWords.forEach(word => {
        if (textLower.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    else if (negativeScore > positiveScore) return 'negative';
    else return 'neutral';
}

/**
 * 키워드 추출
 */
function extractKeywords(text) {
    const foundKeywords = {};
    const textLower = text.toLowerCase();
    
    Object.entries(KEYWORD_PATTERNS).forEach(([category, keywords]) => {
        const foundInCategory = keywords.filter(keyword => textLower.includes(keyword));
        if (foundInCategory.length > 0) {
            foundKeywords[category] = foundInCategory;
        }
    });
    
    return foundKeywords;
}

/**
 * 세부 감정 분석
 */
function analyzeEmotions(text) {
    const emotions = {};
    const textLower = text.toLowerCase();
    
    Object.entries(KEYWORD_PATTERNS).forEach(([emotion, keywords]) => {
        let score = 0;
        keywords.forEach(keyword => {
            if (textLower.includes(keyword)) score++;
        });
        if (score > 0) {
            emotions[emotion] = Math.min(score / keywords.length, 1.0);
        }
    });
    
    return emotions;
}

/**
 * 감정 및 상황 분석
 */
function analyzeSentimentAndEmotion(text) {
    const analysis = {
        sentiment: analyzeSentiment(text),
        emotions: analyzeEmotions(text),
        confidence: Math.random() * 0.3 + 0.7
    };
    return analysis;
}

/**
 * 점수 해석
 */
function interpretScore(score, assessmentType) {
    switch (assessmentType) {
        case 'phq9':
            if (score <= 4) return "최소 수준의 우울감";
            else if (score <= 9) return "경미한 우울감";
            else if (score <= 14) return "중등도 우울감";
            else if (score <= 19) return "중등도-심한 우울감";
            else return "심한 우울감";

        case 'gad7':
            if (score <= 4) return "최소 수준의 불안감";
            else if (score <= 9) return "경미한 불안감";
            else if (score <= 14) return "중등도 불안감";
            else return "심한 불안감";

        case 'stress':
            if (score <= 13) return "낮은 스트레스 수준";
            else if (score <= 26) return "보통 스트레스 수준";
            else return "높은 스트레스 수준";

        default:
            return "평가 완료";
    }
}

/**
 * 대화 단계 결정
 */
function determineConversationPhase(conversationCount) {
    if (conversationCount <= 2) return 'opening';
    else if (conversationCount <= 6) return 'middle';
    else return 'deep';
}

/**
 * 주요 감정 카테고리 결정
 */
function getDominantEmotionCategory(keywords) {
    if (Object.keys(keywords).length === 0) return 'general';
    
    // 키워드 빈도에 따른 가중치 계산
    const categoryWeights = {};
    Object.entries(keywords).forEach(([category, words]) => {
        categoryWeights[category] = words.length;
    });

    // 가장 높은 가중치를 가진 카테고리 반환
    return Object.entries(categoryWeights)
        .sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * 감정 강도 분석
 */
function analyzeEmotionalIntensity(message) {
    const highIntensityWords = [
        '정말', '너무', '매우', '완전히', '극도로', '심각하게', '절대', '전혀',
        '죽을것같', '미치겠', '견딜수없', '한계', '최악', '끝', '절망적',
        '!!!', '!!', '...', 'ㅠㅠ', 'ㅜㅜ', '진짜', '레알'
    ];
    
    const messageLower = message.toLowerCase();
    const intensityScore = highIntensityWords.reduce((score, word) => {
        return score + (messageLower.includes(word) ? 1 : 0);
    }, 0);
    
    if (intensityScore >= 3) return 'high';
    else if (intensityScore >= 1) return 'medium';
    else return 'low';
}

/**
 * 긴급성 감지
 */
function detectUrgency(message) {
    const urgencyKeywords = [
        '지금당장', '즉시', '빨리', '급하게', '응급', '위급', '위험',
        '죽고싶', '자해', '자살', '끝내고싶', '더이상못', '한계'
    ];
    
    return urgencyKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
    );
}

/**
 * 진전/개선 감지
 */
function detectProgress(message) {
    const progressKeywords = [
        '나아지', '좋아지', '개선', '회복', '극복', '해결', '성공',
        '발전', '성장', '변화', '희망', '긍정적', '다행', '기쁘'
    ];
    
    return progressKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
    );
}

/**
 * 혼란 상태 감지
 */
function detectConfusion(message) {
    const confusionKeywords = [
        '모르겠', '헷갈', '혼란', '복잡', '애매', '불분명', '확실하지않',
        '어떻게해야', '뭘해야', '어디서부터', '무엇부터', '갈피못잡'
    ];
    
    return confusionKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
    );
}

/**
 * 감정 트렌드 분석
 */
function analyzeEmotionalTrend(emotions) {
    if (emotions.length < 3) return "분석을 위한 데이터가 부족합니다.";
    
    const positiveCount = emotions.filter(e => e === 'positive').length;
    const negativeCount = emotions.filter(e => e === 'negative').length;
    const neutralCount = emotions.filter(e => e === 'neutral').length;
    
    if (negativeCount > positiveCount + neutralCount) {
        return "최근 대화에서 부정적인 감정이 지속적으로 나타나고 있습니다.";
    } else if (positiveCount > negativeCount + neutralCount) {
        return "최근 대화에서 긍정적인 감정이 증가하는 경향을 보입니다.";
    } else {
        return "감정 상태가 변화하며 안정적인 패턴을 유지하고 있습니다.";
    }
}

/**
 * 랜덤 배열 요소 선택
 */
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}