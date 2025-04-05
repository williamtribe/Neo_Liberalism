"use client";

import KakaoLogin from "@/components/kakao-login"
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 페이지 로드 확인용
    console.log("로그인 페이지가 로드되었습니다");
    setLoading(false);
  }, []);

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">로그인</h1>
        <p className="text-center mb-6">카카오톡으로 로그인 버튼을 클릭하세요</p>
        <div>
          <KakaoLogin />
        </div>
        
        <div className="mt-8 p-4 bg-gray-100 rounded-md text-sm">
          <p className="font-bold text-center mb-2">문제 해결 방법:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>브라우저 개발자 도구(F12)를 열고 Console 탭 확인</li>
            <li>다른 브라우저에서 시도 (크롬, 사파리, 파이어폭스)</li>
            <li>브라우저 캐시 삭제 후 다시 시도</li>
            <li>시크릿 모드/프라이빗 브라우징으로 접속 시도</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

