import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

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
    console.log("사용자 정보 조회 성공:", { 
      id: userData.id,
      nickname: userData.properties?.nickname,
      profile_image: userData.properties?.profile_image,
      email: userData.kakao_account?.email 
    })

    // Supabase에 사용자 정보 저장/업데이트
    console.log("Supabase 사용자 조회 시작...")
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select()
      .eq('kakao_id', userData.id)
      .single();

    console.log("Supabase 사용자 조회 결과:", { existingUser, selectError })

    let userId;
    if (!existingUser) {
      // 새 사용자 생성
      console.log("새 사용자 생성 시작...")
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            kakao_id: userData.id.toString(),
            nickname: userData.properties?.nickname || null,
            profile_image: userData.properties?.profile_image || null,
            email: userData.kakao_account?.email || null
          },
        ])
        .select()
        .single();

      console.log("새 사용자 생성 결과:", { newUser, insertError })
      
      if (insertError) {
        console.error('Error creating new user:', insertError);
        return NextResponse.redirect('/login?error=db_error');
      }
      
      userId = newUser.id;
    } else {
      // 기존 사용자 정보 업데이트
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          nickname: userData.properties?.nickname || null,
          profile_image: userData.properties?.profile_image || null,
          email: userData.kakao_account?.email || null
        })
        .eq('kakao_id', userData.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.redirect('/login?error=db_error');
      }
      
      userId = existingUser.id;
    }

    // 쿠키에 사용자 ID 저장
    cookies().set('user_id', userId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
    });

    console.log("쿠키 설정 완료: 사용자 ID:", userId)
    
    return NextResponse.redirect('/');
  } catch (error) {
    console.error("카카오 로그인 에러:", error instanceof Error ? error.message : error)
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url))
  }
}

