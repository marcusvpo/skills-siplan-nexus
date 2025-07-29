
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  source?: string;
}

interface AIChatProps {
  lessonTitle: string;
}

const AIChat: React.FC<AIChatProps> = ({ lessonTitle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: `Olá! Sou sua assistente virtual para a aula "${lessonTitle}". Posso ajudar com dúvidas sobre o conteúdo do vídeo, funcionalidades do sistema ou esclarecer conceitos. Como posso ajudá-lo?`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      logger.info('🤖 [AIChat] Sending message to OpenAI assistant', {
        messageLength: currentMessage.length,
        threadId,
        lessonTitle
      });

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: currentMessage,
          threadId: threadId,
          lessonTitle: lessonTitle
        }
      });

      if (error) {
        logger.error('❌ [AIChat] Function error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Nenhuma resposta recebida do assistente');
      }

      logger.info('✅ [AIChat] Response received from assistant');

      // Update thread ID if this is the first message
      if (data.threadId && !threadId) {
        setThreadId(data.threadId);
        logger.info('🧵 [AIChat] Thread ID stored:', data.threadId);
      }

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response || data.fallback_response || 'Desculpe, não consegui processar sua solicitação.',
        sender: 'ai',
        timestamp: new Date(),
        source: data.fallback ? 'Resposta de fallback' : `Assistente OpenAI - ${lessonTitle}`
      };

      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      logger.error('❌ [AIChat] Error sending message:', error);
      
      const errorResponse: ChatMessage = {
        id: (Date.now() + 2).toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.',
        sender: 'ai',
        timestamp: new Date(),
        source: 'Mensagem de erro'
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area with enhanced scrolling */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex items-start space-x-3 max-w-[90%] ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`p-2 rounded-full flex-shrink-0 shadow-modern ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-br from-red-600 to-red-700' 
                    : 'bg-gradient-to-br from-blue-600 to-blue-700'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="h-3 w-3 text-white" />
                  ) : (
                    <Bot className="h-3 w-3 text-white" />
                  )}
                </div>
                
                <div className={`rounded-xl p-4 shadow-modern transition-all duration-300 hover:shadow-elevated ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-500/30 text-white'
                    : 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600/30 text-gray-100'
                }`}>
                  {message.sender === 'ai' ? (
                    <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-lg font-bold text-gray-100 mb-3">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold text-gray-100 mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold text-gray-100 mb-2">{children}</h3>,
                          p: ({ children }) => <p className="text-gray-100 mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside text-gray-100 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside text-gray-100 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-100">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
                          code: ({ children }) => <code className="bg-gray-800/50 text-blue-300 px-1 py-0.5 rounded text-xs">{children}</code>,
                          pre: ({ children }) => <pre className="bg-gray-800/50 p-3 rounded-lg overflow-x-auto text-xs text-blue-300 mb-2">{children}</pre>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 mb-2">{children}</blockquote>
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  )}
                  {message.source && (
                    <div className="mt-3 pt-3 border-t border-gray-600/50">
                      <p className="text-xs text-gray-400 italic flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {message.source}
                      </p>
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-2 text-right">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 shadow-modern">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600/30 rounded-xl p-4 shadow-modern">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm text-gray-300">O assistente está pensando...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Enhanced Input Area */}
      <div className="border-t border-gray-700/50 p-4 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
        <div className="flex space-x-3">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta sobre esta aula..."
            className="flex-1 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl transition-all duration-300"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 rounded-xl btn-hover-lift shadow-modern"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Assistente OpenAI integrado • Pressione Enter para enviar
        </p>
      </div>
    </div>
  );
};

export default AIChat;
