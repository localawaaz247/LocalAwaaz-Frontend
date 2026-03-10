import React, { useState, useRef, useEffect } from 'react'
import {  Bot, User, MoreVertical, Phone, Video, Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'

import ChatInput from '../components/ChatInput'

const Assistant = () => {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null);
  const [theme]=useState(localStorage.getItem('theme'))

  


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (messageContent) => {
    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      status: 'sent'
    }
    setMessages([...messages, newMessage])
    
    // Simulate assistant typing
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const assistantResponse = {
        id: messages.length + 2,
        type: 'assistant',
        content: "I understand your concern. Let me help you with that. Based on what you've described, I suggest...",
        timestamp: new Date(),
        status: 'delivered'
      }
      setMessages(prev => [...prev, assistantResponse])
    }, 2000)
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="bg-texture min-h-screen flex flex-col h-screen">
      {/* Chat Header */}
      <div className="glass-card border-b border-border/50 sticky top-0 z-10 mx-4 my-2 rounded-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Assistant</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground ml-1">Online</span>
                </div>
               
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className='px-4 py-2 btn-gradient flex gap-2 border rounded-lg text-white'>
                 <Plus/> New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto thin-scrollbar p-4">
        <div className="max-w-4xl mx-auto">
          {/* Greeting Message - Shows when no messages */}
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Hello! I'm your AI Assistant</h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  How can I help you today? Feel free to ask me anything or share what's on your mind.
                </p>
              </div>
              
              {/* Quick suggestion buttons */}
              <div className="flex flex-wrap gap-3 justify-center mt-8">
                <button className="px-4 py-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-full text-foreground hover:bg-card transition-colors">
                  💡 Help me with a problem
                </button>
                <button className="px-4 py-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-full text-foreground hover:bg-card transition-colors">
                  📝 Report an issue
                </button>
                <button className="px-4 py-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-full text-foreground hover:bg-card transition-colors">
                  🤖 Just want to chat
                </button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up mb-4`}
            >
              <div className={`flex items-end space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {message.type === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`relative group`}>
                  <Card className={`glass-card p-3 ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground' 
                      : 'bg-card border-border/50'
                  }`}>
                    <p className={`text-sm ${message.type === 'user' ? 'text-white' : 'text-foreground'}`}>
                      {message.content}
                    </p>
                    <div className={`flex items-center justify-between mt-1 text-xs ${
                      message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.type === 'user' && (
                        <div className="flex items-center space-x-1">
                          {message.status === 'sent' && <span className="text-xs">✓</span>}
                          {message.status === 'delivered' && <span className="text-xs">✓✓</span>}
                        </div>
                      )}
                    </div>
                  </Card>
                  
                  {/* Message hover effects */}
                  <div className={`absolute -top-2 ${message.type === 'user' ? '-left-2' : '-right-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                    <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${
                      message.type === 'user' 
                        ? 'from-primary to-secondary' 
                        : 'from-accent to-primary'
                    } animate-pulse`}></div>
                  </div>
                </div>

                {message.type === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-muted">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="flex items-end space-x-2 max-w-[80%]">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="glass-card bg-card border-border/50 p-3">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">Assistant is typing...</span>
                  </div>
                </Card>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input Component */}
      <ChatInput onSendMessage={handleSendMessage} />

      
    </div>
  )
}

export default Assistant
