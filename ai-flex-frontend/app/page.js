"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChatMessage } from "@/components/ChatMessage"
import { HealthAnalysisDisplay } from "@/components/HealthAnalysisDisplay"

let API_URL = process.env.NEXT_PUBLIC_API_URL
export default function Home() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "bot",
      content: "Hello! I'm your Health Assistant. Describe your symptoms, and I'll analyze them for you.",
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const cardRef = useRef(null)
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!input.trim()) return
    
    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }
    
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    console.log("Sending request to API...",API_URL)
    
    try {
      // Replace with your actual API endpoint
      const res = await fetch(`${API_URL}/api/symptoms/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: input }),
      });
      
      
      if (!res.ok) {
        throw new Error("Failed to analyze symptoms")
      }
      
      const analysisData = await res.json()
      
      // Adapt the data to match the expected format
      const adaptedData = {
        possibleConditions: [
          {
            name: analysisData.summary.replace("Symptom Analysis: ", ""),
            description: analysisData.description
          },
          ...(analysisData.conditions?.possible_conditions || [])
        ],
        symptoms: analysisData.conditions?.common_symptoms || [],
        remedies: analysisData.remedies || [],
        precautions: analysisData.precautions || []
      }
      
      // Add bot response with adapted analysis
      const botMessage = {
        id: Date.now().toString(),
        type: "analysis",
        content: "Here's my analysis of your symptoms:",
        timestamp: new Date(),
        analysis: adaptedData,
      }
      
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      // Add error message
      const errorMessage = {
        id: Date.now().toString(),
        type: "bot",
        content: "Sorry, I couldn't analyze your symptoms. Please try again.",
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col bg-cyan-900 w-full h-screen border-0 shadow-none rounded-none">
      <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-cyan-800 flex items-center gap-2">
        <Bot size={18} className="text-cyan-300 size-8" />
        <h2 className="text-base sm:text-lg font-semibold text-white whitespace-nowrap">AI Health Assistant</h2>
      </div>
      
      <div className="flex-1 m-2 sm:m-5 overflow-hidden">
        <Card 
          ref={cardRef}
          className="h-full bg-cyan-800/20 border-cyan-800/50 overflow-y-auto scrollbar-none"
        >
          <CardContent className="p-2 sm:p-4 h-full">
            <div className="flex flex-col gap-3 sm:gap-4">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.type === "analysis" ? (
                    <div className="space-y-2 sm:space-y-3">
                      <ChatMessage message={message} />
                      <HealthAnalysisDisplay data={message.analysis} />
                    </div>
                  ) : (
                    <ChatMessage message={message} />
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 select-none items-center justify-center rounded-full bg-cyan-700 text-cyan-300">
                    <Bot size={16} />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-none bg-cyan-800 p-2 sm:p-3 text-xs sm:text-sm text-cyan-100">
                    <Loader2 size={14} className="animate-spin text-cyan-300" />
                    <span className="whitespace-normal">Analyzing your symptoms...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <form 
        onSubmit={handleSubmit}
        className="border-t border-cyan-800 p-2 sm:p-4 bg-cyan-900"
      >
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Describe your symptoms..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-cyan-800 border-cyan-700 text-white text-sm sm:text-base placeholder-cyan-300/70 focus:border-cyan-500 focus:ring-cyan-500"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !input.trim()}
            className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white h-9 w-9 sm:h-10 sm:w-10"
          >
            <Send size={16} className="" />
          </Button>
        </div>
      </form>
    </div>
  )
}