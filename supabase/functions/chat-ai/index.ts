
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('openai_api_key');
const assistantIdOrionTN = Deno.env.get('ASSISTANT_ID'); // Assistente padrão para Orion TN
const assistantIdOrionPRO = Deno.env.get('ASSISTANT_ID_ORION_PRO'); // Novo assistente para Orion PRO
const vectorStoreIdOrionTN = Deno.env.get('VECTOR_STORE_ID_ORION_TN'); // Vector Store para Orion TN
const vectorStoreIdOrionPRO = Deno.env.get('VECTOR_STORE_ID_ORION_PRO'); // Vector Store para Orion PRO

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
    let vectorStoreId: string;
    
    // Verificar se o título da aula contém "orion pro" (case-insensitive)
    if (lessonTitle && lessonTitle.toLowerCase().includes('orion pro')) {
      assistantId = assistantIdOrionPRO;
      vectorStoreId = vectorStoreIdOrionPRO;
      assistantName = 'Orion PRO';
      console.log('🤖 [chat-ai] Using Orion PRO Assistant (detected from lesson title)');
      console.log('✅ [chat-ai] Assistant ID:', assistantIdOrionPRO);
      console.log('📚 [chat-ai] Vector Store ID:', vectorStoreIdOrionPRO);
    } else {
      assistantId = assistantIdOrionTN;
      vectorStoreId = vectorStoreIdOrionTN;
      assistantName = 'Orion TN (default)';
      console.log('🤖 [chat-ai] Using Orion TN Assistant (default)');
      console.log('✅ [chat-ai] Assistant ID:', assistantIdOrionTN);
      console.log('📚 [chat-ai] Vector Store ID:', vectorStoreIdOrionTN);
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

    // Add the user message to the thread with mandatory file_search attachment
    console.log('💬 [chat-ai] Adding message to thread with vector store attachment');
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
          attachments: [
            {
              tools: [{ type: "file_search" }]
            }
          ],
          metadata: {
            lesson_title: lessonTitle || 'Unknown Lesson',
            timestamp: new Date().toISOString(),
            vector_store_id: vectorStoreId
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

    // Poll for completion with extended timeout (60s)
    const maxAttempts = 30;
    let attempts = 0;
    let runStatus = 'in_progress';

    while (attempts < maxAttempts && runStatus === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const statusResponse = await fetch(
          `https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`,
          {
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'OpenAI-Beta': 'assistants=v2',
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!statusResponse.ok) {
          console.error(`❌ [chat-ai] Error checking run status (attempt ${attempts}/${maxAttempts}):`, statusResponse.status);
          continue;
        }

        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log(`🔄 [chat-ai] Run status (attempt ${attempts}/${maxAttempts}):`, runStatus);

        if (runStatus === 'completed') {
          break;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`❌ [chat-ai] Error fetching run status (attempt ${attempts}/${maxAttempts}):`, error.message);
      }
    }

    // If timeout, return friendly message
    if (runStatus !== 'completed') {
      console.log('⏱️ [chat-ai] Response timeout - returning fallback');
      return new Response(JSON.stringify({
        timeout: true,
        fallback_response: 'O assistente está demorando mais que o esperado. Por favor, reformule sua pergunta de forma mais simples ou tente novamente.',
        threadId: currentThreadId,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the assistant's response
    const messagesResponse = await fetch(
      `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      }
    );

    if (!messagesResponse.ok) {
      throw new Error('Failed to fetch messages');
    }

    const messagesData = await messagesResponse.json();
    const assistantMessage = messagesData.data.find(
      (msg: any) => msg.role === 'assistant'
    );

    if (!assistantMessage || !assistantMessage.content?.[0]?.text?.value) {
      throw new Error('No response from assistant');
    }

    const responseText = assistantMessage.content[0].text.value;
    console.log('✅ [chat-ai] Response generated successfully');
    console.log('📤 [chat-ai] Sending response payload:', {
      responseLength: responseText.length,
      threadId: currentThreadId,
      hasResponse: !!responseText
    });

    return new Response(JSON.stringify({
      response: responseText,
      threadId: currentThreadId,
      timestamp: new Date().toISOString()
    }), {
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
