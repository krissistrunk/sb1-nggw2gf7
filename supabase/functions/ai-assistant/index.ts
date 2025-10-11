import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

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