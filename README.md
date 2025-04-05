# Neo_Liberalism

Next.js 기반의 신자유주의 챗봇 프로젝트입니다.

## 기술 스택

- Next.js 14
- TypeScript
- Tailwind CSS
- LangChain
- OpenAI
- Pinecone

## 주요 기능

- 신자유주의 관련 질문에 대한 AI 응답
- 벡터 데이터베이스를 활용한 컨텍스트 기반 답변
- 사용자 인증 기능

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정해야 합니다:

```
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
```