"use client";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function KakaoLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
  // 브라우저의 현재 origin을 사용
  const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const REDIRECT_URI = `${BASE_URL}/api/auth/kakao/callback`

  const handleKakaoLogin = () => {
    if (!KAKAO_CLIENT_ID) {
      setError("카카오 클라이언트 ID가 설정되지 않았습니다.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`
      
      console.log("카카오 로그인 시도:", {
        clientId: KAKAO_CLIENT_ID.slice(0, 5) + "...",
        redirectUri: REDIRECT_URI
      })

      window.location.href = kakaoURL
    } catch (error) {
      console.error("카카오 로그인 오류:", error)
      setError("로그인 처리 중 오류가 발생했습니다.")
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Button
          onClick={handleKakaoLogin}
          disabled={isLoading}
          className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-black font-medium"
        >
          {isLoading ? "로그인 중..." : "카카오톡으로 로그인"}
        </Button>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        <div className="mt-4 text-sm text-gray-500">
          <p>리다이렉트 URI를 카카오 개발자 콘솔에 등록했는지 확인하세요:</p>
          <p className="font-mono mt-1 break-all">
            {REDIRECT_URI}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}