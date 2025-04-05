import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';

// 환경 변수 검증
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;

// 백업용 샘플 응답
const sampleResponses: Record<string, string> = {
  "신자유주의": "신자유주의는 1970년대 후반부터 시작된 경제 이론 및 정책으로, 시장의 자유화, 규제 완화, 민영화, 재정 긴축 등을 특징으로 합니다. 주요 이론가로는 프리드리히 하이에크, 밀턴 프리드먼 등이 있으며, 레이건(미국)과 대처(영국) 정부에서 본격적으로 도입되었습니다.",
  "하이에크": "프리드리히 하이에크(Friedrich Hayek)는 오스트리아 출신의 경제학자이자 정치철학자로, 신자유주의의 주요 이론적 기반을 제공했습니다.",
  "밀턴 프리드먼": "밀턴 프리드먼(Milton Friedman)은 미국의 경제학자로 시카고 학파의 중요한 인물입니다. 그는 통화주의(Monetarism)를 주창하며, 정부 개입을 최소화하고 시장의 자율성을 강조했습니다."
};

export async function POST(request: Request) {
  // 인증 확인
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id");
  
  if (!userId) {
    return NextResponse.json(
      { error: "인증이 필요합니다" },
      { status: 401 }
    );
  }
  
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: "메시지가 필요합니다" },
        { status: 400 }
      );
    }

    // 환경 변수 체크
    if (!OPENAI_API_KEY || !PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
      console.error("환경 변수가 설정되지 않았습니다", {
        OPENAI_API_KEY: !!OPENAI_API_KEY,
        PINECONE_API_KEY: !!PINECONE_API_KEY,
        PINECONE_INDEX_NAME: !!PINECONE_INDEX_NAME
      });
      
      // 환경 변수가 없으면 샘플 응답 반환
      let response = "죄송합니다. 해당 주제에 대한 정보가 없습니다.";
      
      for (const [keyword, answer] of Object.entries(sampleResponses)) {
        if (message.toLowerCase().includes(keyword.toLowerCase())) {
          response = answer;
          break;
        }
      }
      
      // 일반적인 인사에 대한 응답
      if (message.match(/안녕|반가워|시작|도움|소개/)) {
        response = "안녕하세요! 저는 신자유주의에 대한 정보를 제공하는 AI 챗봇입니다.";
      }
      
      return NextResponse.json({
        response: response,
        userId: userId.value
      });
    }

    try {
      console.log("Pinecone 및 OpenAI 연동 시작...");
      
      // 1. Pinecone 클라이언트 초기화 (최신 SDK)
      const pinecone = new Pinecone({
        apiKey: PINECONE_API_KEY!,
      });
      
      // 2. 인덱스 가져오기
      const index = pinecone.Index(PINECONE_INDEX_NAME!);
      
      // 3. OpenAI 임베딩 초기화 (text-embedding-3-large는 3072 차원)
      const embeddings = new OpenAIEmbeddings({
        apiKey: OPENAI_API_KEY,
        modelName: "text-embedding-3-large", // 3072 차원 벡터 생성
        dimensions: 3072, // Pinecone 인덱스 차원과 일치하도록 설정
      });
      
      // 4. Vector Store 생성
      console.log("임베딩 모델: text-embedding-3-large (차원: 3072)");
      console.log(`Pinecone 인덱스 이름: ${PINECONE_INDEX_NAME}`);
      
      let vectorStore;
      try {
        vectorStore = await PineconeStore.fromExistingIndex(
          embeddings,
          { 
            pineconeIndex: index
          }
        );
        console.log("Pinecone 인덱스와 벡터 저장소 연결 성공");
      } catch (error) {
        console.error("Pinecone 벡터 저장소 초기화 오류:", error);
        console.error("오류 메시지에 'Vector dimension'이 포함되어 있다면, 임베딩 모델과 Pinecone 인덱스의 차원이 일치하지 않는 것입니다.");
        console.error("현재 Pinecone 인덱스 차원이 3072이므로, 임베딩 모델도 text-embedding-3-large(3072 차원)을 사용해야 합니다.");
        throw error;
      }
      
      // 5. 검색기 생성
      const retriever = vectorStore.asRetriever({
        searchType: "similarity",
        k: 10, // 상위 10개 문서 검색
      });
      
      // 6. 문서 검색
      console.log(`"${message}" 관련 문서 검색 중...`);
      const docs = await retriever.invoke(message);
      const contextText = docs.map(doc => doc.pageContent).join("\n\n");
      
      // 7. OpenAI 모델 초기화
      const model = new ChatOpenAI({
        apiKey: OPENAI_API_KEY,
        modelName: "gpt-4o-mini",
        temperature: 0.7,
      });
      
      // 8. 프롬프트 템플릿 설정
      const systemTemplate = `
        당신은 정치경제학과 신자유주의에 대한 전문가입니다.
        주어진 컨텍스트를 기반으로 사용자의 질문에 답변해주세요.
        컨텍스트에 관련 정보가 없다면, 모르겠다고 솔직하게 대답하세요.
        답변은 친절하고 명확하게 해주세요.
        
        컨텍스트:
        {context}
      `;
      
      const humanTemplate = "{question}";
      
      const chatPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(systemTemplate),
        HumanMessagePromptTemplate.fromTemplate(humanTemplate),
      ]);
      
      // 9. LangChain 체인 설정
      const chain = RunnableSequence.from([
        {
          context: async () => contextText,
          question: () => message,
        },
        chatPrompt,
        model,
        new StringOutputParser(),
      ]);
      
      // 10. 응답 생성
      console.log("LLM 응답 생성 중...");
      const response = await chain.invoke({});
      
      console.log(`응답 생성 완료: ${response.substring(0, 50)}...`);
      
      return NextResponse.json({
        response: response,
        userId: userId.value
      });
    } catch (llmError) {
      console.error("LLM 처리 오류:", llmError);
      
      // LLM/Pinecone 오류 시 백업 응답 제공
      let fallbackResponse = "죄송합니다. 서비스 처리 중 오류가 발생했습니다.";
      
      for (const [keyword, answer] of Object.entries(sampleResponses)) {
        if (message.toLowerCase().includes(keyword.toLowerCase())) {
          fallbackResponse = `${answer} (백업 응답)`;
          break;
        }
      }
      
      return NextResponse.json({
        response: fallbackResponse,
        userId: userId.value
      });
    }
    
  } catch (error) {
    console.error("챗봇 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}