"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function KakaoLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKakaoLogin = () => {
    setIsLoading(true);
    setError(null);

    try {
      // 카카오 REST API 앱 키
      const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;

      // 현재 배포/로컬 환경에 맞춰 redirect_uri 생성
      const REDIRECT_URI = `${window.location.origin}/api/auth/kakao/callback`;

      // 카카오 OAuth URL
      const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;

      // 로그인 페이지로 이동
      window.location.href = kakaoURL;
    } catch (error) {
      console.error("카카오 로그인 오류:", error);
      setError("로그인 처리 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-8 flex flex-col items-center">
        {/* 예: public 폴더의 /images/kakao-login.png 를 사용 */}
        <div className="mb-4">
          <Image
            src="/images/Rhee_quote.png"
            alt="카카오 로고"
            width={120}
            height={120}
            priority
          />
        </div>

        <Button
          onClick={handleKakaoLogin}
          disabled={isLoading}
          className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-black font-medium"
        >
          {isLoading ? "로그인 중..." : "카카오톡으로 로그인"}
        </Button>

        {error && (
          <p className="text-red-500 mt-4 text-center">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
