import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const origin = process.env.NEXT_PUBLIC_DOMAIN || new URL(request.url).origin
  const redirectUri = `${origin}/api/auth/kakao/callback`

  if (!code) {
    console.error("인증 코드가 없습니다")
    return NextResponse.redirect(new URL("/login?error=no_code", request.url))
  }

  try {
    // 환경 변수 존재 여부 확인
    if (!process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID) {
      console.error("NEXT_PUBLIC_KAKAO_CLIENT_ID가 설정되지 않았습니다")
      throw new Error("Missing KAKAO_CLIENT_ID")
    }

    // 환경 변수 디버깅
    console.log("환경 변수 디버깅:", {
      NEXT_PUBLIC_KAKAO_CLIENT_ID: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
      NEXT_PUBLIC_KAKAO_CLIENT_SECRET: process.env.NEXT_PUBLIC_KAKAO_CLIENT_SECRET ? "설정됨" : "설정안됨",
      NODE_ENV: process.env.NODE_ENV,
      origin: origin,
      redirectUri: redirectUri
    })

    const tokenRequestBody = {
      grant_type: "authorization_code",
      client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
      redirect_uri: redirectUri,
      code,
    }

    // Client Secret이 있는 경우에만 추가
    if (process.env.NEXT_PUBLIC_KAKAO_CLIENT_SECRET) {
      Object.assign(tokenRequestBody, { client_secret: process.env.NEXT_PUBLIC_KAKAO_CLIENT_SECRET })
    }

    console.log("카카오 토큰 요청 정보:", {
      ...tokenRequestBody,
      client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID, // 전체 클라이언트 ID 표시 (디버깅용)
      client_secret: process.env.NEXT_PUBLIC_KAKAO_CLIENT_SECRET ? process.env.NEXT_PUBLIC_KAKAO_CLIENT_SECRET : "설정안됨", // 전체 시크릿 표시 (디버깅용)
      redirect_uri: redirectUri,
    })

    // 카카오 토큰 요청
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(tokenRequestBody),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("카카오 토큰 발급 실패 응답:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        requestedRedirectUri: redirectUri,
        tokenRequestBody: {
          ...tokenRequestBody,
          code: code.slice(0, 10) + "..." // 보안을 위해 코드 일부만 표시
        }
      })
      
      // 자세한 오류 내용 파싱 시도
      try {
        const errorJson = JSON.parse(errorText);
        console.error("파싱된 오류 정보:", errorJson);
        
        // 일반적인 오류에 대한 상세 안내
        if (errorJson.error === "invalid_client") {
          console.error("클라이언트 ID 또는 시크릿이 올바르지 않습니다. 카카오 개발자 콘솔에서 확인하세요.");
        } else if (errorJson.error === "invalid_grant") {
          console.error("인증 코드나 리다이렉트 URI가 올바르지 않습니다. 카카오 개발자 콘솔에 등록된 리다이렉트 URI를 확인하세요.");
        }
      } catch (e) {
        console.error("오류 응답 파싱 실패:", e);
      }
      
      throw new Error(`카카오 토큰 발급 실패: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log("토큰 발급 성공")

    // 사용자 정보 요청
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("사용자 정보 요청 실패:", errorText)
      throw new Error(`사용자 정보 요청 실패: ${errorText}`)
    }

    const userData = await userResponse.json()
    console.log("사용자 정보 조회 성공:", { id: userData.id })

    // NextResponse 객체 생성
    const response = NextResponse.redirect(new URL("/", request.url))
    
    // 쿠키 설정을 NextResponse 객체에 적용
    response.cookies.set("kakao_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokenData.expires_in,
      path: "/",
    })

    response.cookies.set("user_id", userData.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    })

    console.log("쿠키 설정 완료: 사용자 ID:", userData.id)
    
    return response
  } catch (error) {
    console.error("카카오 로그인 에러:", error instanceof Error ? error.message : error)
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url))
  }
}

