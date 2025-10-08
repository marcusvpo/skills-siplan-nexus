
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('openai_api_key');
const assistantIdOrionTN = Deno.env.get('ASSISTANT_ID'); // Assistente padrão para Orion TN
const assistantIdOrionPRO = Deno.env.get('ASSISTANT_ID_ORION_PRO'); // Novo assistente para Orion PRO

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('🤖 [chat-ai] Function started');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('❌ [chat-ai] Missing OpenAI API key');
      throw new Error('OpenAI API key not configured');
    }
    
    if (!assistantIdOrionTN) {
      console.error('❌ [chat-ai] Missing Orion TN Assistant ID');
      throw new Error('Orion TN Assistant ID not configured');
    }

    if (!assistantIdOrionPRO) {
      console.error('❌ [chat-ai] Missing Orion PRO Assistant ID');
      throw new Error('Orion PRO Assistant ID not configured');
    }

    const { message, threadId, lessonTitle } = await req.json();
    
    console.log('📨 [chat-ai] Received request:', { 
      messageLength: message?.length, 
      threadId, 
      lessonTitle,
      lessonTitleType: typeof lessonTitle
    });
    
    // Selecionar o assistente correto baseado no TÍTULO DA AULA
    let assistantId: string;
    let assistantName: string;
    
    // Verificar se o título da aula contém "orion pro" (case-insensitive)
    if (lessonTitle && lessonTitle.toLowerCase().includes('orion pro')) {
      assistantId = assistantIdOrionPRO;
      assistantName = 'Orion PRO';
      console.log('🤖 [chat-ai] Using Orion PRO Assistant (detected from lesson title)');
      console.log('✅ [chat-ai] Assistant ID:', assistantIdOrionPRO);
    } else {
      assistantId = assistantIdOrionTN;
      assistantName = 'Orion TN (default)';
      console.log('🤖 [chat-ai] Using Orion TN Assistant (default)');
      console.log('✅ [chat-ai] Assistant ID:', assistantIdOrionTN);
    }
    
    console.log('🔍 [chat-ai] Lesson Title:', lessonTitle);
    console.log('🎯 [chat-ai] Selected Assistant:', assistantName);

    if (!message || message.trim() === '') {
      throw new Error('Message is required');
    }

    let currentThreadId = threadId;

    // Create a new thread if one doesn't exist
    if (!currentThreadId) {
      console.log('🧵 [chat-ai] Creating new thread');
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          metadata: {
            lesson_title: lessonTitle || 'Unknown Lesson',
            platform: 'siplan-skills'
          }
        }),
      });

      if (!threadResponse.ok) {
        const errorText = await threadResponse.text();
        console.error('❌ [chat-ai] Failed to create thread:', errorText);
        throw new Error(`Failed to create thread: ${threadResponse.status}`);
      }

      const threadData = await threadResponse.json();
      currentThreadId = threadData.id;
      console.log('✅ [chat-ai] Thread created:', currentThreadId);
    }

    // Add the user message to the thread
    console.log('💬 [chat-ai] Adding message to thread');
    let messageResponse;
    try {
      messageResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          role: 'user',
          content: message,
          metadata: {
            lesson_title: lessonTitle || 'Unknown Lesson',
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!messageResponse.ok) {
        const errorText = await messageResponse.text();
        console.error('❌ [chat-ai] Failed to add message:', errorText);
        throw new Error(`Failed to add message: ${messageResponse.status}`);
      }
    } catch (error) {
      console.error('❌ [chat-ai] Error adding message to thread:', error);
      return new Response(JSON.stringify({
        error: 'Erro ao adiciar mensagem à conversa',
        fallback_response: 'Desculpe, houve um problema ao processar sua mensagem. Tente novamente.',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Run the assistant with streaming enabled
    console.log('🚀 [chat-ai] Running assistant with streaming');
    let runResponse;
    try {
      runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          assistant_id: assistantId,
          stream: true
        }),
      });

      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        console.error('❌ [chat-ai] Failed to run assistant:', errorText);
        throw new Error(`Failed to run assistant: ${runResponse.status}`);
      }
    } catch (error) {
      console.error('❌ [chat-ai] Error calling OpenAI run API:', error);
      return new Response(JSON.stringify({
        error: 'Erro ao iniciar processamento da mensagem',
        fallback_response: 'Desculpe, houve um problema ao processar sua mensagem. Tente novamente.',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [chat-ai] Streaming response started');

    // Create a readable stream to forward the OpenAI stream to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = runResponse.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Send final message with threadId
              const finalData = JSON.stringify({
                type: 'done',
                threadId: currentThreadId,
                fullResponse: fullResponse,
                timestamp: new Date().toISOString()
              });
              controller.enqueue(new TextEncoder().encode(`data: ${finalData}\n\n`));
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '' || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                
                // Handle thread.message.delta events for text streaming
                if (parsed.event === 'thread.message.delta') {
                  const delta = parsed.data?.delta?.content?.[0];
                  if (delta?.type === 'text' && delta?.text?.value) {
                    const textChunk = delta.text.value;
                    fullResponse += textChunk;
                    
                    // Forward the chunk to the client
                    const chunkData = JSON.stringify({
                      type: 'chunk',
                      content: textChunk,
                      timestamp: new Date().toISOString()
                    });
                    controller.enqueue(new TextEncoder().encode(`data: ${chunkData}\n\n`));
                  }
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        } catch (error) {
          console.error('❌ [chat-ai] Streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            error: 'Erro durante o streaming da resposta',
            timestamp: new Date().toISOString()
          });
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    // Caso nenhuma resposta tenha sido retornada, retornar erro
    console.error('❌ [chat-ai] No response generated');
    return new Response(JSON.stringify({
      error: 'No response generated',
      fallback_response: 'Desculpe, não consegui gerar uma resposta. Tente novamente.',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [chat-ai] Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor',
      fallback_response: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
