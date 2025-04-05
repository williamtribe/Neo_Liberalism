"use client";

import Image from "next/image";
import KakaoLogin from "@/components/kakao-login";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <div className="max-w-md w-full text-center">
        {/* 이미지 (예: /public/welcome.png) */}
        <div className="mb-6">
          {/* 
            Image 컴포넌트 사용 시 next.config.js에서 domains 설정이 필요할 수 있습니다. 
            간단히 <img> 태그로 대체하셔도 됩니다.
          */}
          <Image 
            src="/welcome.png" 
            alt="Welcome" 
            width={200} 
            height={200} 
            className="mx-auto" 
          />
        </div>
        
        {/* 페이지 헤더 */}
        <h1 className="text-3xl font-bold mb-4">로그인</h1>
        
        {/* 간단한 서비스 소개 문구 */}
        <p className="mb-8 text-lg">
          AI 챗봇 서비스를 이용하시려면 로그인해주세요. <br />
          카카오 계정으로 간편하게 시작해보세요!
        </p>
        
        {/* 카카오 로그인 버튼 */}
        <KakaoLogin />
      </div>
    </div>
  );
}
