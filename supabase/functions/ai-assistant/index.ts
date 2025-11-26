import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Anthropic from "npm:@anthropic-ai/sdk@0.32.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AIRequest {
  feature: string;
  data: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { feature, data }: AIRequest = await req.json();
    const startTime = Date.now();

    let result;
    let promptTokens = 0;
    let completionTokens = 0;

    switch (feature) {
      case "suggest-actions":
        result = await suggestActions(openaiKey, data);
        break;
      case "refine-purpose":
        result = await refinePurpose(openaiKey, data);
        break;
      case "daily-plan":
        result = await generateDailyPlan(openaiKey, data);
        break;
      case "generate-insights":
        result = await generateInsights(openaiKey, data);
        break;
      case "transcribe-voice":
        result = await transcribeVoice(openaiKey, data);
        break;
      case "suggest-chunks":
        result = await suggestChunks(openaiKey, data);
        break;
      case "coaching-response":
        result = await coachingResponse(anthropicKey, { ...data, supabase, userId: user.id });
        break;
      case "save-voice-session":
        result = await saveVoiceSession(supabase, user.id, data);
        break;
      case "extract-knowledge":
        result = await extractKnowledge(anthropicKey, supabase, user.id, data);
        break;
      case "semantic-search":
        result = await semanticSearch(openaiKey, supabase, user.id, data);
        break;
      case "generate-embedding":
        result = await generateEmbedding(openaiKey, data);
        break;
      case "elevenlabs-tts":
        result = await elevenlabsTTS(data);
        break;
      default:
        throw new Error(`Unknown feature: ${feature}`);
    }

    const responseTime = Date.now() - startTime;

    if (result.usage) {
      promptTokens = result.usage.prompt_tokens || 0;
      completionTokens = result.usage.completion_tokens || 0;
    }

    await supabase.from("ai_interaction_logs").insert({
      user_id: user.id,
      organization_id: data.organization_id,
      feature_type: feature,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
      model: "gpt-4o-mini",
      response_time_ms: responseTime,
      success: true,
    });

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function callOpenAI(apiKey: string, messages: any[], temperature = 0.7) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  return await response.json();
}

async function callClaude(apiKey: string, messages: any[], temperature = 0.7) {
  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  const systemMessage = messages.find((m: any) => m.role === "system");
  const conversationMessages = messages.filter((m: any) => m.role !== "system");

  const formattedMessages = conversationMessages.map((m: any) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    temperature: temperature,
    system: systemMessage ? systemMessage.content : undefined,
    messages: formattedMessages,
  });

  const textContent = response.content.find((block: any) => block.type === "text");

  return {
    choices: [{
      message: {
        content: textContent?.text || "",
      },
    }],
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

async function suggestActions(apiKey: string, data: any) {
  const { outcome, existingActions } = data;

  const messages = [
    {
      role: "system",
      content: "You are an expert productivity coach specializing in the RPM (Results, Purpose, Massive Action) methodology. Your job is to suggest specific, actionable steps to achieve outcomes. Each action should be clear, measurable, and achievable. Consider the purpose when suggesting actions.",
    },
    {
      role: "user",
      content: `I need help creating an action plan for this outcome:

Title: ${outcome.title}
Purpose: ${outcome.purpose}
Description: ${outcome.description || "N/A"}

${existingActions?.length > 0 ? `Existing actions:\n${existingActions.map((a: any) => `- ${a.title}`).join("\n")}` : "No existing actions yet."}

Please suggest 5-7 specific, actionable steps to achieve this outcome. Format your response as a JSON array with objects containing:
- title: the action title
- notes: additional context or details (optional)
- priority: 1 (high), 2 (medium), or 3 (low)
- duration_minutes: estimated time to complete
- reasoning: why this action is important

Return ONLY the JSON array, no additional text.`,
    },
  ];

  const response = await callOpenAI(apiKey, messages, 0.7);
  const content = response.choices[0].message.content;
  
  let actions;
  try {
    actions = JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\[.*\]/s);
    if (jsonMatch) {
      actions = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse AI response");
    }
  }

  return {
    data: { actions },
    usage: response.usage,
  };
}

async function refinePurpose(apiKey: string, data: any) {
  const { purpose, title, context } = data;

  const messages = [
    {
      role: "system",
      content: "You are an expert in crafting compelling purpose statements using the RPM methodology. A great purpose statement should be emotionally resonant, specific, and clearly articulate WHY this outcome matters. It should motivate and inspire action.",
    },
    {
      role: "user",
      content: `Help me refine this purpose statement:

Outcome: ${title}
Current Purpose: ${purpose}
${context ? `Context: ${context}` : ""}

Please provide:
1. An improved version of the purpose statement
2. Alternative versions with different tones (motivational, professional, personal)
3. Specific feedback on what makes each version effective

Format as JSON:
{
  "refined": "main improved version",
  "alternatives": [
    { "tone": "motivational", "text": "...", "rationale": "..." },
    { "tone": "professional", "text": "...", "rationale": "..." },
    { "tone": "personal", "text": "...", "rationale": "..." }
  ],
  "feedback": "overall feedback on the original"
}

Return ONLY the JSON, no additional text.`,
    },
  ];

  const response = await callOpenAI(apiKey, messages, 0.8);
  const content = response.choices[0].message.content;
  
  let refinement;
  try {
    refinement = JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\{.*\}/s);
    if (jsonMatch) {
      refinement = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse AI response");
    }
  }

  return {
    data: refinement,
    usage: response.usage,
  };
}

async function generateDailyPlan(apiKey: string, data: any) {
  const { outcomes, actions, completionHistory, date } = data;

  const messages = [
    {
      role: "system",
      content: "You are an expert daily planning assistant. Analyze outcomes and actions to recommend the best 1-5 outcomes to focus on today. Consider deadlines, priorities, completion patterns, and realistic time constraints. Balance ambition with achievability. Provide clear reasoning for each recommendation.",
    },
    {
      role: "user",
      content: `Help me plan my day for ${date}.

Active Outcomes (${outcomes.length}):
${outcomes.map((o: any) => `- ${o.title} (${o.actions?.length || 0} actions, Purpose: ${o.purpose})`).join("\n")}

Actions scheduled for today: ${actions.length}

${completionHistory ? `Recent completion rate: ${completionHistory.rate}%` : ""}

Recommend 1-5 outcomes to focus on today with reasoning. Consider workload capacity and prioritize the most impactful outcomes. Format as JSON:
{
  "recommendations": [
    {
      "outcome_id": "uuid",
      "outcome_title": "title",
      "priority": 1-3,
      "reasoning": "why focus on this today",
      "suggested_actions": ["action titles to do today"]
    }
  ],
  "overall_strategy": "general advice for the day"
}

Return ONLY the JSON, no additional text.`,
    },
  ];

  const response = await callOpenAI(apiKey, messages, 0.6);
  const content = response.choices[0].message.content;
  
  let plan;
  try {
    plan = JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\{.*\}/s);
    if (jsonMatch) {
      plan = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse AI response");
    }
  }

  return {
    data: plan,
    usage: response.usage,
  };
}

async function generateInsights(apiKey: string, data: any) {
  const { period, completedActions, outcomes, timeBlocks } = data;

  const messages = [
    {
      role: "system",
      content: "You are an expert productivity analyst. Analyze user activity patterns, identify trends, spot bottlenecks, and provide actionable recommendations for improvement. Be specific and data-driven.",
    },
    {
      role: "user",
      content: `Analyze my productivity for ${period.type} (${period.start} to ${period.end}):

Completed Actions: ${completedActions.length}
Active Outcomes: ${outcomes.length}
Time Blocks: ${timeBlocks?.length || 0}

Completed Actions Detail:
${completedActions.slice(0, 20).map((a: any) => `- ${a.title} (${a.duration_minutes}min, ${a.done ? "Done" : "Incomplete"})`).join("\n")}

Provide comprehensive insights. Format as JSON:
{
  "summary": "overall summary",
  "patterns": [
    { "type": "pattern type", "description": "what you noticed", "impact": "positive/negative/neutral" }
  ],
  "achievements": ["key wins"],
  "challenges": ["areas of concern"],
  "recommendations": [
    { "priority": "high/medium/low", "action": "what to do", "rationale": "why" }
  ],
  "metrics": {
    "completion_rate": 0-100,
    "focus_areas": ["area names"],
    "avg_task_duration": "in minutes"
  }
}

Return ONLY the JSON, no additional text.`,
    },
  ];

  const response = await callOpenAI(apiKey, messages, 0.7);
  const content = response.choices[0].message.content;
  
  let insights;
  try {
    insights = JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\{.*\}/s);
    if (jsonMatch) {
      insights = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse AI response");
    }
  }

  return {
    data: insights,
    usage: response.usage,
  };
}

async function transcribeVoice(apiKey: string, data: any) {
  const { audioData, sessionType } = data;

  const formData = new FormData();
  const audioBlob = new Blob([Uint8Array.from(atob(audioData), c => c.charCodeAt(0))], { type: "audio/webm" });
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-1");

  const transcribeResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!transcribeResponse.ok) {
    throw new Error("Transcription failed");
  }

  const transcription = await transcribeResponse.json();

  const messages = [
    {
      role: "system",
      content: "You are an expert at extracting actionable items from voice notes. Categorize items as actions, outcomes, or general notes. Identify key themes and suggest areas of life they relate to.",
    },
    {
      role: "user",
      content: `Analyze this voice note transcription and extract structured information:

"${transcription.text}"

Session type: ${sessionType}

Format as JSON:
{
  "transcript": "the full transcription",
  "items": [
    { "type": "ACTION/OUTCOME/NOTE", "content": "extracted item", "priority": 1-3 }
  ],
  "themes": ["identified themes"],
  "suggested_area": "life area this relates to",
  "summary": "brief summary"
}

Return ONLY the JSON, no additional text.`,
    },
  ];

  const response = await callOpenAI(apiKey, messages, 0.7);
  const content = response.choices[0].message.content;

  let analysis;
  try {
    analysis = JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\{.*\}/s);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse AI response");
    }
  }

  const coachingPrompts = {
    PLANNING: "Based on what you've shared, it sounds like you have several priorities. What's most important to focus on first?",
    REFLECTION: "Thank you for sharing that. How do you feel about what you've accomplished?",
    COACHING: "I hear you. What would success look like for you in this area?",
    MOTIVATION: "That's great! What's driving your motivation to achieve this?",
    CLARIFICATION: "Help me understand - why does this matter to you?",
  };

  const aiResponse = coachingPrompts[sessionType as keyof typeof coachingPrompts] || coachingPrompts.COACHING;
  analysis.ai_response = aiResponse;

  return {
    data: analysis,
    usage: response.usage,
  };
}

async function suggestChunks(apiKey: string, data: any) {
  const { inboxItems } = data;

  const messages = [
    {
      role: "system",
      content: "You are an expert at organizing and grouping related items. Analyze inbox items and suggest logical groupings (chunks) based on themes, projects, or areas of life. Recommend which chunks should become outcomes.",
    },
    {
      role: "user",
      content: `Analyze these inbox items and suggest how to group them into chunks:

${inboxItems.map((item: any, i: number) => `${i + 1}. ${item.content} (${item.item_type})`).join("\n")}

Format as JSON:
{
  "suggested_chunks": [
    {
      "name": "chunk name",
      "description": "what this chunk is about",
      "item_indices": [0, 2, 5],
      "should_convert": true/false,
      "reasoning": "why group these together",
      "suggested_outcome_title": "if converting to outcome"
    }
  ],
  "ungrouped_items": [1, 3],
  "overall_advice": "general guidance"
}

Return ONLY the JSON, no additional text.`,
    },
  ];

  const response = await callOpenAI(apiKey, messages, 0.7);
  const content = response.choices[0].message.content;
  
  let suggestions;
  try {
    suggestions = JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\{.*\}/s);
    if (jsonMatch) {
      suggestions = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse AI response");
    }
  }

  return {
    data: suggestions,
    usage: response.usage,
  };
}

async function coachingResponse(apiKey: string, data: any) {
  const { sessionType, userMessage, conversationHistory, contextData, supabase, userId } = data;

  let relevantKnowledge: any[] = [];
  let knowledgeContext = '';

  if (supabase && userId) {
    try {
      const searchQuery = userMessage + ' ' + (conversationHistory?.slice(-2).map((m: any) => m.content).join(' ') || '');
      const knowledgeResults = await semanticSearch(apiKey, supabase, userId, {
        query: searchQuery,
        limit: 3,
      });

      relevantKnowledge = knowledgeResults.data?.notes || [];

      if (relevantKnowledge.length > 0) {
        knowledgeContext = '\n\nRELEVANT PAST INSIGHTS FROM USER\'S KNOWLEDGE BASE:\n' +
          relevantKnowledge.map((note: any, i: number) =>
            `${i + 1}. "${note.title}" (${new Date(note.created_at).toLocaleDateString()}):\n   ${note.content.substring(0, 200)}...`
          ).join('\n\n') +
          '\n\nYou can naturally reference these past insights if relevant to the current conversation. Use phrases like "I recall from your notes..." or "You mentioned before that..." to create continuity.';
      }
    } catch (err) {
      console.error('Failed to retrieve knowledge:', err);
    }
  }

  const systemPrompts = {
    PLANNING: "You are an expert productivity coach specializing in the RPM (Results, Purpose, Massive Action) methodology. Your role is to help users create focused, purposeful daily plans through natural conversation.\n\nKey responsibilities:\n- Ask clarifying questions about their priorities and goals\n- Help them identify 3-4 key outcomes to focus on today\n- Guide them to connect with the WHY behind each goal (purpose)\n- Suggest specific, actionable steps with estimated time\n- Keep responses concise and actionable (2-3 sentences max)\n- Be warm, encouraging, and conversational\n\nWhen the user shares their priorities, help them:\n1. Clarify what RESULTS they want to achieve\n2. Connect to their PURPOSE (why it matters emotionally)\n3. Identify MASSIVE ACTIONS to take today\n\nKeep the conversation flowing naturally. Ask one thoughtful question at a time." + knowledgeContext,

    REFLECTION: "You are a thoughtful AI coach helping with reflection and learning. Ask deep questions to help the user process their experiences, identify patterns, celebrate wins, and extract insights. Be empathetic and curious.\n\nFocus on:\n- What went well and why\n- What they learned from challenges\n- Patterns they notice in their behavior\n- How they can apply insights going forward\n\nKeep responses brief (2-3 sentences) and ask powerful questions." + knowledgeContext,

    COACHING: "You are an empowering AI life coach using the RPM methodology. Help the user gain clarity on their goals, overcome obstacles, and tap into their motivation. Use powerful questions and active listening.\n\nBe supportive but challenging when appropriate. Keep responses concise and focused. Ask questions that help them discover their own answers." + knowledgeContext,

    MOTIVATION: "You are an energizing AI coach focused on motivation and confidence-building. Celebrate achievements, reframe challenges as opportunities, and help the user connect with their inner drive.\n\nBe enthusiastic and uplifting but not over the top. Keep responses brief and energizing. Help them see their progress and potential." + knowledgeContext,

    CLARIFICATION: "You are a clear-thinking AI coach helping to clarify purpose and vision using RPM principles. Ask probing questions to help the user articulate what truly matters and why.\n\nHelp them move from vague ideas to concrete, emotionally resonant purpose statements. The best purposes answer: 'What will achieving this give me? How will I feel?'\n\nBe patient and thoughtful. One question at a time." + knowledgeContext,
  };

  const messages = [
    {
      role: "system",
      content: systemPrompts[sessionType] || systemPrompts.COACHING,
    },
  ];

  conversationHistory.forEach((msg: any) => {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  });

  messages.push({
    role: "user",
    content: userMessage,
  });

  const response = await callClaude(apiKey, messages, 0.8);
  const coachResponse = response.choices[0].message.content;

  return {
    data: {
      response: coachResponse,
      relevantKnowledge: relevantKnowledge.map((note: any) => ({
        id: note.id,
        title: note.title,
        created_at: note.created_at,
      })),
    },
    usage: response.usage,
  };
}

async function saveVoiceSession(supabase: any, userId: string, data: any) {
  const {
    sessionType,
    contextType,
    contextId,
    audioUrl,
    transcript,
    durationSeconds,
    aiInsights,
    aiResponse,
  } = data;

  const { data: session, error } = await supabase
    .from("voice_sessions")
    .insert({
      user_id: userId,
      organization_id: data.organization_id,
      session_type: sessionType,
      context_type: contextType,
      context_id: contextId,
      audio_url: audioUrl,
      transcript,
      duration_seconds: durationSeconds,
      ai_insights: aiInsights || {},
      ai_response: aiResponse,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save voice session: ${error.message}`);
  }

  return {
    data: session,
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

async function extractKnowledge(apiKey: string, supabase: any, userId: string, data: any) {
  const { sessionTranscript, conversationHistory, sessionType, organizationId } = data;

  const systemPrompt = `You are an expert at extracting key insights, patterns, and learnings from coaching conversations.

Analyze the coaching session and extract:
1. Key insights - Important realizations the user had
2. Patterns - Recurring themes or behaviors mentioned
3. Commitments - Specific actions or decisions made
4. Questions - Open questions user is grappling with
5. Obstacles - Challenges or blocks identified

For each extracted item:
- Create a clear, searchable title
- Write content in the user's own words where possible
- Suggest relevant tags
- Identify potential links to related concepts

Return a JSON array of knowledge notes with this structure:
{
  "notes": [
    {
      "title": "Clear, descriptive title",
      "content": "Full markdown content with context",
      "note_type": "insight|pattern|learning",
      "tags": ["tag1", "tag2"],
      "potential_links": ["concept1", "concept2"]
    }
  ]
}

Be selective - only extract truly valuable insights worth remembering.`;

  const conversationText = conversationHistory
    .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`)
    .join('\n\n');

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Analyze this coaching session and extract key knowledge:\n\n${conversationText}`,
    },
  ];

  const response = await callClaude(apiKey, messages, 0.3);
  const extractedContent = response.choices[0].message.content;

  let extractedNotes;
  try {
    const jsonMatch = extractedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extractedNotes = JSON.parse(jsonMatch[0]);
    } else {
      extractedNotes = JSON.parse(extractedContent);
    }
  } catch (e) {
    extractedNotes = { notes: [] };
  }

  const createdNotes = [];

  for (const note of extractedNotes.notes || []) {
    const { data: createdNote, error: noteError } = await supabase
      .from('knowledge_notes')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        title: note.title,
        content: note.content,
        note_type: note.note_type || 'insight',
        source_type: 'coaching_session',
        source_id: data.sessionId,
        metadata: {
          tags: note.tags || [],
          potential_links: note.potential_links || [],
          session_type: sessionType,
        },
      })
      .select()
      .single();

    if (!noteError && createdNote) {
      createdNotes.push(createdNote);

      for (const tagName of note.tags || []) {
        let tag = await supabase
          .from('knowledge_tags')
          .select()
          .eq('user_id', userId)
          .eq('tag_name', tagName)
          .maybeSingle();

        if (!tag.data) {
          const { data: newTag } = await supabase
            .from('knowledge_tags')
            .insert({
              user_id: userId,
              organization_id: organizationId,
              tag_name: tagName,
            })
            .select()
            .single();

          tag = { data: newTag };
        }

        if (tag.data) {
          await supabase.from('knowledge_note_tags').insert({
            note_id: createdNote.id,
            tag_id: tag.data.id,
          });
        }
      }
    }
  }

  return {
    data: {
      notes_created: createdNotes.length,
      notes: createdNotes,
    },
    usage: response.usage,
  };
}

async function generateEmbedding(apiKey: string, data: any) {
  const { text } = data;

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Embeddings API error: ${error}`);
  }

  const result = await response.json();

  return {
    data: {
      embedding: result.data[0].embedding,
    },
    usage: result.usage,
  };
}

async function semanticSearch(apiKey: string, supabase: any, userId: string, data: any) {
  const { query, limit = 5 } = data;

  const embeddingResult = await generateEmbedding(apiKey, { text: query });
  const queryEmbedding = embeddingResult.data.embedding;

  const { data: notes, error } = await supabase.rpc('search_knowledge_notes', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
    user_id_param: userId,
  });

  if (error) {
    console.error('Semantic search error:', error);
    return {
      data: { notes: [] },
      usage: embeddingResult.usage,
    };
  }

  return {
    data: {
      notes: notes || [],
    },
    usage: embeddingResult.usage,
  };
}

async function elevenlabsTTS(data: any) {
  const { text, voiceId, options } = data;

  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const requestBody = {
    text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: options?.stability || 0.5,
      similarity_boost: options?.similarity_boost || 0.75,
      style: options?.style || 0,
      use_speaker_boost: options?.use_speaker_boost !== false,
    },
  };

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
  const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

  return {
    data: {
      audioUrl,
    },
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}