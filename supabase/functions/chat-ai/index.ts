
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

    const { message, threadId, lessonTitle, systemName } = await req.json();
    
    console.log('📨 [chat-ai] Received request:', { 
      messageLength: message?.length, 
      threadId, 
      lessonTitle,
      systemName,
      systemNameType: typeof systemName
    });
    
    // Selecionar o assistente correto baseado no sistema
    let assistantId: string;
    let assistantName: string;
    
    // Verificar se o nome do sistema contém "orion pro" (case-insensitive)
    if (systemName && systemName.toLowerCase().includes('orion pro')) {
      assistantId = assistantIdOrionPRO;
      assistantName = 'Orion PRO';
      console.log('🤖 [chat-ai] Using Orion PRO Assistant');
      console.log('✅ [chat-ai] Assistant ID:', assistantIdOrionPRO);
    } else {
      assistantId = assistantIdOrionTN;
      assistantName = 'Orion TN (default)';
      console.log('🤖 [chat-ai] Using Orion TN Assistant (default)');
      console.log('✅ [chat-ai] Assistant ID:', assistantIdOrionTN);
    }
    
    console.log('🔍 [chat-ai] System Name received:', systemName);
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
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
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

    // Run the assistant
    console.log('🚀 [chat-ai] Running assistant');
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: assistantId
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('❌ [chat-ai] Failed to run assistant:', errorText);
      throw new Error(`Failed to run assistant: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;
    console.log('✅ [chat-ai] Assistant run started:', runId);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      attempts++;

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (!statusResponse.ok) {
        console.error('❌ [chat-ai] Failed to check run status');
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`🔄 [chat-ai] Run status (attempt ${attempts}):`, statusData.status);

      if (statusData.status === 'completed') {
        // Get the assistant's response
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages?order=desc&limit=1`, {
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        });

        if (!messagesResponse.ok) {
          throw new Error('Failed to retrieve messages');
        }

        const messagesData = await messagesResponse.json();
        const assistantMessage = messagesData.data[0];
        
        if (assistantMessage && assistantMessage.role === 'assistant') {
          const responseText = assistantMessage.content[0]?.text?.value || 'Desculpe, não consegui gerar uma resposta.';
          
          console.log('✅ [chat-ai] Response generated successfully');
          return new Response(JSON.stringify({
            response: responseText,
            threadId: currentThreadId,
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;
      } else if (statusData.status === 'failed' || statusData.status === 'cancelled' || statusData.status === 'expired') {
        console.error('❌ [chat-ai] Run failed with status:', statusData.status);
        throw new Error(`Assistant run failed: ${statusData.status}`);
      }
    }

    // Timeout fallback
    if (attempts >= maxAttempts) {
      console.warn('⚠️ [chat-ai] Assistant response timeout, using fallback');
      return new Response(JSON.stringify({
        response: 'Desculpe, estou com dificuldades para responder no momento. Tente reformular sua pergunta ou aguarde alguns instantes.',
        threadId: currentThreadId,
        timestamp: new Date().toISOString(),
        fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
