import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are ReviewAI, a helpful and knowledgeable AI tutor. Your job is to help students learn by:
- Explaining concepts clearly and step-by-step
- Adapting your explanation to the student's level
- Using markdown formatting for readability
- Using LaTeX math notation (inline with $...$ and display with $$...$$) for math
- Providing examples and analogies
- Encouraging students and being positive
- Asking follow-up questions to check understanding

When showing code, use proper markdown code blocks with language tags.
When showing math, use KaTeX-compatible LaTeX notation.
Be concise but thorough. If you don't know something, say so.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, action, content, difficulty, numQuestions, questionTypes, subject, topic } = await req.json();

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured. Please add the OPENAI_API_KEY secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: any;

    if (action === "chat") {
      result = await streamChat(messages, openaiKey);
      return new Response(result.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else if (action === "generate_quiz") {
      result = await generateQuiz(subject, topic, difficulty, numQuestions, questionTypes, openaiKey);
    } else if (action === "generate_flashcards") {
      result = await generateFlashcards(content, openaiKey);
    } else if (action === "summarize") {
      result = await summarizeText(content, openaiKey);
    } else if (action === "simplify") {
      result = await simplifyText(content, openaiKey);
    } else if (action === "rewrite") {
      result = await rewriteText(content, openaiKey);
    } else if (action === "translate") {
      result = await translateText(content, subject, openaiKey);
    } else if (action === "study_plan") {
      result = await generateStudyPlan(content, openaiKey);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function streamChat(messages: any[], apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          controller.enqueue(chunk);
        }
      } catch (e) {
        controller.error(e);
      }
      controller.close();
    },
  });

  return { body: stream };
}

async function generateQuiz(subject: string, topic: string, difficulty: string, numQuestions: number, questionTypes: string[], apiKey: string) {
  const prompt = `Generate a quiz about "${topic}" under the subject "${subject}" with ${numQuestions} questions.
Difficulty: ${difficulty}
Question types to include: ${questionTypes.join(", ")}

Return ONLY a JSON array of question objects. Each object must have:
- "question_type": one of "multiple_choice", "true_false", "identification", "fill_blank", "essay"
- "question_text": the question
- "options": array of strings (for multiple_choice only, 4 options)
- "correct_answer": the correct answer
- "explanation": a brief explanation of why the answer is correct

For true_false, options should be ["True", "False"] and correct_answer is "True" or "False".
For identification, fill_blank, and essay, options should be an empty array.

Return ONLY valid JSON, no markdown formatting.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(text);
    const questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.quiz || []);
    return { questions };
  } catch {
    return { questions: [], raw: text };
  }
}

async function generateFlashcards(content: string, apiKey: string) {
  const prompt = `Based on the following content, generate flashcards.
Each flashcard should have a "front" (question or term) and "back" (answer or definition).
Generate 10-20 flashcards covering the key concepts.

Content:
${content}

Return ONLY a JSON object with a "flashcards" array containing objects with "front" and "back" fields. No markdown.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) throw new Error(`OpenAI error: ${await response.text()}`);
  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return { flashcards: parsed.flashcards || [] };
}

async function summarizeText(content: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize the following text concisely while keeping key points. Use markdown." },
        { role: "user", content },
      ],
      temperature: 0.5, max_tokens: 1000,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${await response.text()}`);
  const data = await response.json();
  return { result: data.choices[0].message.content };
}

async function simplifyText(content: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Simplify the following text so a middle school student can understand it. Use markdown." },
        { role: "user", content },
      ],
      temperature: 0.5, max_tokens: 1000,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${await response.text()}`);
  const data = await response.json();
  return { result: data.choices[0].message.content };
}

async function rewriteText(content: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Rewrite the following text to improve clarity, flow, and readability. Keep the same meaning. Use markdown." },
        { role: "user", content },
      ],
      temperature: 0.7, max_tokens: 1000,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${await response.text()}`);
  const data = await response.json();
  return { result: data.choices[0].message.content };
}

async function translateText(content: string, targetLang: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `Translate the following text to ${targetLang}. Keep markdown formatting.` },
        { role: "user", content },
      ],
      temperature: 0.3, max_tokens: 1000,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${await response.text()}`);
  const data = await response.json();
  return { result: data.choices[0].message.content };
}

async function generateStudyPlan(content: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Create a structured study plan based on the student's request. Use markdown with clear sections, daily goals, and recommended resources. Be practical and motivating." },
        { role: "user", content },
      ],
      temperature: 0.7, max_tokens: 1500,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${await response.text()}`);
  const data = await response.json();
  return { result: data.choices[0].message.content };
}
