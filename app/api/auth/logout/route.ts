import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = await cookies()

  // 카카오 액세스 토큰 가져오기
  const kakaoToken = cookieStore.get("kakao_access_token")

  if (kakaoToken?.value) {
    try {
      // 카카오 로그아웃 API 호출 (선택 사항)
      await fetch("https://kapi.kakao.com/v1/user/logout", {
        headers: {
          Authorization: `Bearer ${kakaoToken.value}`,
        },
      })
    } catch (error) {
      console.error("Kakao logout error:", error)
    }
  }

  // NextResponse 객체에 쿠키 삭제 적용
  const response = NextResponse.json({ success: true })
  
  response.cookies.delete("kakao_access_token")
  response.cookies.delete("user_id")
  
  console.log("로그아웃 성공: 쿠키 삭제 완료")
  
  return response
}

