import { cookies } from "next/headers"

export async function getUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")

  if (!userId) {
    return null
  }

  // 여기서는 간단히 사용자 ID만 반환하지만,
  // 실제 앱에서는 데이터베이스에서 사용자 정보를 조회할 수 있습니다
  return {
    id: userId.value,
    isLoggedIn: true,
  }
}

export async function isAuthenticated() {
  const user = await getUser()
  return !!user
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("kakao_access_token")
  cookieStore.delete("user_id")
}

