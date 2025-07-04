
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, MessageCircle } from 'lucide-react';

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
    setInputMessage('');
    setIsLoading(true);

    // Simular resposta da IA (em produção, seria conectado ao backend)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Entendi sua pergunta sobre "${inputMessage}". Esta funcionalidade será implementada em breve e permitirá que você tire dúvidas específicas sobre o conteúdo da videoaula "${lessonTitle}".

A IA será capaz de:
• Responder perguntas sobre o conteúdo específico desta videoaula
• Explicar funcionalidades do sistema mostradas no vídeo
• Fornecer contexto adicional sobre os procedimentos apresentados
• Sugerir próximos passos de aprendizado

Em breve, esta conversa será enriquecida com o conhecimento específico do vídeo que você está assistindo.`,
        sender: 'ai',
        timestamp: new Date(),
        source: `Baseado no conteúdo da videoaula: ${lessonTitle}`
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2000);
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
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          IA contextual será ativada em breve • Pressione Enter para enviar
        </p>
      </div>
    </div>
  );
};

export default AIChat;
