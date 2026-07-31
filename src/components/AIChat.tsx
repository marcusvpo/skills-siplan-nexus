
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
  systemName?: string;
}

const AIChat: React.FC<AIChatProps> = ({ lessonTitle, systemName }) => {
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

      logger.info('📤 [AIChat] Invoking edge function with:', {
        lessonTitle,
        containsOrionPRO: lessonTitle?.toLowerCase().includes('orion pro')
      });

      const { data: functionData, error: functionError } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: currentMessage,
          threadId: threadId,
          lessonTitle: lessonTitle
        }
      });

      logger.info('📥 [AIChat] Edge function response:', {
        hasData: !!functionData,
        hasError: !!functionError,
        data: functionData
      });

      if (functionError) {
        logger.error('❌ [AIChat] Function error:', functionError);
        throw functionError;
      }

      if (!functionData) {
        throw new Error('No response from assistant');
      }

      // Handle error response
      if (functionData.error) {
        throw new Error(functionData.fallback_response || functionData.error);
      }

      // Handle timeout
      if (functionData.timeout) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: functionData.fallback_response || 'O assistente está demorando mais que o esperado. Por favor, tente novamente.',
          sender: 'ai',
          timestamp: new Date(),
          source: `Assistente OpenAI - Timeout`
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      // Success case
      logger.info('✅ [AIChat] Valid response received from assistant');
      
      // Remove citations from response
      const cleanResponse = functionData.response?.replace(/【[^】]*】/g, '') || functionData.response;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: cleanResponse,
        sender: 'ai',
        timestamp: new Date(),
        source: `Assistente OpenAI - ${lessonTitle}`
      };

      setMessages(prev => [...prev, aiMessage]);
      
      if (functionData.threadId) {
        setThreadId(functionData.threadId);
        logger.info('🧵 [AIChat] Thread ID stored:', functionData.threadId);
      }
    } catch (error) {
      logger.error('❌ [AIChat] Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.',
        sender: 'ai',
        timestamp: new Date(),
        source: 'Mensagem de erro'
      };
      
      setMessages(prev => [...prev, errorMessage]);
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
              <div className={`flex items-start space-x-3 max-w-[90%] min-w-0 ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                  message.sender === 'user' 
                    ? 'bg-primary/15 text-primary' 
                    : 'bg-accent text-accent-foreground'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <Bot className="h-3 w-3" />
                  )}
                </div>
                
                <div className={`min-w-0 rounded-xl p-4 border transition-all duration-300 ${
                  message.sender === 'user'
                    ? 'bg-primary/10 border-primary/30 text-foreground'
                    : 'bg-card/70 backdrop-blur-md border-border/50 text-foreground'
                }`}>
                  {message.sender === 'ai' ? (
                    <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mb-3">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold text-foreground mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold text-foreground mb-2">{children}</h3>,
                          p: ({ children }) => <p className="text-foreground mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside text-foreground mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside text-foreground mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-foreground">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                          em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                          code: ({ children }) => <code className="bg-muted text-primary px-1 py-0.5 rounded text-xs">{children}</code>,
                          pre: ({ children }) => <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs text-primary mb-2">{children}</pre>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-2">{children}</blockquote>
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  )}
                  {message.source && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground italic flex items-center">
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="bg-card/70 backdrop-blur-md border border-border/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">O assistente está pensando...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Enhanced Input Area */}
      <div className="border-t border-border/50 p-4 bg-card/50 backdrop-blur-md">
        <div className="flex space-x-3">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta sobre esta aula..."
            className="flex-1 rounded-xl transition-all duration-300"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            variant="glow"
            className="px-4 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Assistente OpenAI integrado • Pressione Enter para enviar
        </p>
      </div>
    </div>
  );
};

export default AIChat;
