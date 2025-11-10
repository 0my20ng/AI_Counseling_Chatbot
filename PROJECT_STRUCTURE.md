# AI 상담 챗봇 프로젝트 구조

## 📁 파일 구조

```
ai-counseling-chatbot/
├── index.html              # 메인 HTML 파일
├── css/
│   └── styles.css          # 모든 스타일시트
├── js/
│   ├── config.js           # 설정 및 데이터 (평가도구, 키워드 패턴)
│   ├── utils.js            # 유틸리티 함수 (감정분석, 익명화 등)
│   ├── chatbot.js          # 메인 챗봇 클래스 (분할됨)
│   ├── ai-provider.js      # AI API 호출 로직 (OpenAI, Gemini 등)
│   ├── response.js         # 로컬 응답 생성 로직
│   ├── assessment.js       # 심리검사 관련 로직
│   └── ui.js               # UI 렌더링 함수들
├── .gitignore
├── README.md
└── PROJECT_STRUCTURE.md    # 이 파일
```

## 📄 파일별 역할

### 1. index.html
- **역할**: HTML 구조 정의
- **포함 요소**:
  - 설정 패널
  - 헤더 (세션 정보 포함)
  - 채팅 컨테이너
  - 입력 영역
- **스크립트 로딩 순서**:
  1. config.js (설정/데이터)
  2. utils.js (유틸리티)
  3. response.js (응답 생성)
  4. ai-provider.js (AI API)
  5. assessment.js (심리검사)
  6. ui.js (UI 함수)
  7. chatbot.js (메인 클래스)

### 2. css/styles.css
- **역할**: 모든 스타일 정의
- **주요 섹션**:
  - 기본 스타일 및 리셋
  - 컨테이너 및 레이아웃
  - 헤더 스타일
  - 채팅 메시지 스타일
  - 평가 카드 스타일
  - 분석 결과 표시
  - 입력 영역
  - 반응형 디자인

### 3. js/config.js
- **역할**: 전역 설정 및 데이터
- **내용**:
  - `ASSESSMENT_DATA`: PHQ-9, GAD-7, PSS 질문들
  - `SCALE_DESCRIPTIONS`: 평가 척도 설명
  - `KEYWORD_PATTERNS`: 감정/상황별 키워드 목록
  - `CATEGORY_NAMES`: 카테고리 한글명

### 4. js/utils.js
- **역할**: 재사용 가능한 유틸리티 함수
- **주요 함수**:
  - `escapeHtml()`: XSS 방지
  - `anonymizeText()`: 개인정보 익명화
  - `analyzeSentiment()`: 감정 점수 분석
  - `extractKeywords()`: 키워드 추출
  - `interpretScore()`: 검사 점수 해석
  - `detectUrgency()`: 위기 상황 감지
  - 기타 분석 함수들

### 5. js/chatbot.js (분할 필요)
- **역할**: 메인 챗봇 클래스 및 상태 관리
- **주요 메서드**:
  - 생성자 및 초기화
  - 이벤트 리스너 설정
  - 설정 관리
  - 모드 선택
  - 메시지 처리 흐름 제어
  - 대화 종료

### 6. js/ai-provider.js (새로 생성 필요)
- **역할**: 외부 AI API 호출
- **주요 함수**:
  - `callOpenAI()`: OpenAI GPT API
  - `callGoogleGemini()`: Google Gemini API
  - `buildSystemPrompt()`: 시스템 프롬프트 생성
  - `buildConversationContext()`: 대화 컨텍스트 구성

### 7. js/response.js (새로 생성 필요)
- **역할**: 로컬 응답 생성 (AI 없이)
- **주요 함수**:
  - `generateLocalResponse()`: 패턴 기반 응답 생성
  - `selectContextualResponse()`: 맥락에 맞는 응답 선택
  - `generateFollowUpQuestion()`: 후속 질문 생성
  - 감정별/단계별 응답 템플릿

### 8. js/assessment.js (새로 생성 필요)
- **역할**: 심리검사 관련 로직
- **주요 함수**:
  - `determineAssessmentPath()`: 검사 유형 결정
  - `askNextAssessmentQuestion()`: 다음 질문 제시
  - `handleAssessmentResponse()`: 응답 처리
  - `provideSummaryAndRecommendations()`: 결과 제공
  - `suggestAssessmentIfNeeded()`: 검사 제안

### 9. js/ui.js (새로 생성 필요)
- **역할**: UI 렌더링 및 DOM 조작
- **주요 함수**:
  - `addUserMessage()`: 사용자 메시지 추가
  - `addBotMessage()`: 봇 메시지 추가
  - `addSystemMessage()`: 시스템 메시지 추가
  - `addAssessmentQuestion()`: 평가 질문 UI
  - `showEmotionAnalysis()`: 감정 분석 표시
  - `showTypingIndicator()`: 타이핑 인디케이터
  - `provideConversationAnalysis()`: 대화 분석 표시

## 🔄 데이터 흐름

```
사용자 입력
    ↓
chatbot.processResponse()
    ↓
분석 (utils.js)
    ├─ 키워드 추출
    ├─ 감정 분석
    └─ 위험 요소 감지
    ↓
AI 응답 생성
    ├─ 외부 API (ai-provider.js)
    └─ 로컬 생성 (response.js)
    ↓
UI 업데이트 (ui.js)
    ├─ 메시지 표시
    ├─ 분석 결과 표시
    └─ 후속 액션 (검사 제안 등)
```

## 🛠️ 다음 작업

1. **chatbot.js 분할**:
   - AI 호출 부분 → ai-provider.js
   - 응답 생성 부분 → response.js
   - 평가 관련 → assessment.js
   - UI 조작 → ui.js

2. **새 파일 생성**:
   - js/ai-provider.js
   - js/response.js
   - js/assessment.js
   - js/ui.js

3. **index.html 업데이트**:
   - 새로운 JS 파일들 로드 추가

4. **테스트**:
   - 각 모듈별 독립 테스트
   - 통합 테스트

## 📝 코딩 컨벤션

- **함수명**: camelCase
- **상수명**: UPPER_SNAKE_CASE
- **클래스명**: PascalCase
- **주석**: JSDoc 스타일
- **들여쓰기**: 4 spaces
- **세미콜론**: 사용

## 🔐 보안 고려사항

- XSS 방지: `escapeHtml()` 사용
- 개인정보 익명화: `anonymizeText()` 적용
- API 키: sessionStorage만 사용 (localStorage 금지)
- 세션 데이터: 종료 시 완전 삭제