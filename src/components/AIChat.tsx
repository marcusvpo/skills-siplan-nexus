import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

const AIChat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, `Você: ${input}`]);
    setLoading(true);

    // Simulação de resposta da IA
    setTimeout(() => {
      setMessages((prev) => [...prev, `IA: Resposta gerada para "${input}"`]);
      setLoading(false);
    }, 1000);

    setInput('');
  };

  return (
    <Layout>
      <div className="min-h-screen page-transition bg-gradient-to-br from-[#2a2a2a] via-[#1c1c1c] to-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
            Assistente com IA
          </h1>

          <div className="bg-[#1f1f1f] rounded-xl p-6 shadow-elevated mb-8 max-h-[500px] overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className="text-sm text-gray-200 whitespace-pre-line">
                {msg}
              </div>
            ))}
            {loading && <Skeleton className="h-4 w-1/3" />}
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-4">
            <Textarea
              className="flex-1 min-h-[100px] bg-[#111] text-white border border-gray-700 placeholder-gray-500"
              placeholder="Digite sua pergunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button
              onClick={handleSend}
              className="btn-hover-lift bg-red-600 hover:bg-red-700 text-white"
            >
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIChat;
