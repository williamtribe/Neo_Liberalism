"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/logout-button";
import ChatBot from "@/components/chat-bot";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 쿠키 확인으로 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          method: "GET",
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(data.isLoggedIn);
          setUserId(data.userId);
        }
      } catch (error) {
        console.error("로그인 상태 확인 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const goToLogin = () => {
    console.log("로그인 페이지로 이동 시도");
    router.push("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-white to-blue-50">
      <h1 className="text-4xl font-bold mb-8 text-red-600">자유주의자 챗봇</h1>
      
      {loading ? (
        <p className="text-xl mb-8">로딩 중...</p>
      ) : isLoggedIn ? (
        <div className="w-full max-w-5xl flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-8 px-4 py-2 bg-blue-100 rounded-lg">
            <p className="text-md text-blue-700 font-semibold">사용자 ID: {userId}</p>
            <LogoutButton />
          </div>
          
          <ChatBot />
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xl mb-8">AI 챗봇을 사용하려면 로그인해주세요</p>
          <Button 
            onClick={goToLogin}
            className="bg-[#FEE500] hover:bg-[#FEE500]/90 text-black font-medium text-lg py-6 px-8"
          >
            카카오로 로그인하기
          </Button>
        </div>
      )}
    </div>
  );
}

