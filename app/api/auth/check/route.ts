import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id");

  return NextResponse.json({
    isLoggedIn: !!userId,
    userId: userId?.value || null
  });
}