"use client";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function KakaoLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 디버깅을 위해 환경 변수 값 출력
  console.log("환경 변수 확인:", {
    KAKAO_CLIENT_ID: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
    ALL_ENV: process.env
  })
  
  // 환경 변수에서 값을 가져오거나 하드코딩된 값 사용 (테스트용)
  const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || "e0772ba9c735390b3717b8c356017597"
  // 브라우저의 현재 origin을 사용
  const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const REDIRECT_URI = `${BASE_URL}/api/auth/kakao/callback`

  const handleKakaoLogin = () => {
    console.log("버튼 클릭됨 - 함수 실행 시작")
    
    if (!KAKAO_CLIENT_ID) {
      console.log("카카오 클라이언트 ID 없음:", KAKAO_CLIENT_ID)
      setError("카카오 클라이언트 ID가 설정되지 않았습니다.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`
      
      console.log("카카오 로그인 시도:", {
        clientId: KAKAO_CLIENT_ID.slice(0, 5) + "...",
        redirectUri: REDIRECT_URI,
        fullURL: kakaoURL
      })

      console.log("리다이렉트 시작...")
      window.location.href = kakaoURL
    } catch (error) {
      console.error("카카오 로그인 오류:", error)
      setError("로그인 처리 중 오류가 발생했습니다.")
      setIsLoading(false)
    }
  }

  // 카카오 인증 URL을 미리 생성
  const kakaoURL = KAKAO_CLIENT_ID 
    ? `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`
    : "#";

  return (
    <Card>
      <CardContent className="pt-6">
        {/* 방식 1: Button 컴포넌트 */}
        <Button
          onClick={(e) => {
            console.log("버튼 클릭 이벤트 발생", e)
            handleKakaoLogin()
          }}
          disabled={isLoading}
          className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-black font-medium text-lg py-3"
          type="button"
        >
          {isLoading ? "로그인 중..." : "카카오톡으로 로그인"}
        </Button>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <p className="font-mono">디버그 정보:</p>
          <p className="font-mono overflow-auto mt-1">ClientID: {KAKAO_CLIENT_ID ? KAKAO_CLIENT_ID.substring(0, 8) + "..." : "없음"}</p>
          <p className="font-mono overflow-auto mt-1">RedirectURI: {REDIRECT_URI}</p>
          <p className="font-mono overflow-auto mt-1 break-all">URL: {kakaoURL}</p>
        </div>
      </CardContent>
    </Card>
  )
}