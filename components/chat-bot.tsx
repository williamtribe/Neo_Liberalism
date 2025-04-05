"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "안녕하세요! 무엇을 도와드릴까요?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // 사용자 메시지 추가
    const userMessage = { role: "user" as const, content: input };
    const userInput = input.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    // "생각 중..." 메시지 추가
    const thinkingMessage = { role: "assistant" as const, content: "생각 중..." };
    setMessages((prev) => [...prev, thinkingMessage]);
    
    try {
      // 실제 API 호출
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userInput }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API 응답 오류");
      }
      
      const data = await response.json();
      
      // "생각 중..." 메시지를 실제 응답으로 교체
      setMessages((prev) => 
        prev.slice(0, -1).concat({ 
          role: "assistant" as const, 
          content: data.response 
        })
      );
      
    } catch (error) {
      console.error("챗봇 응답 오류:", error);
      // "생각 중..." 메시지를 오류 메시지로 교체
      setMessages((prev) => 
        prev.slice(0, -1).concat({ 
          role: "assistant" as const, 
          content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요." 
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl shadow-lg border-2 border-blue-200 mx-auto">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-center text-xl">챗봇</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-[80%] ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "전송 중..." : "전송"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}