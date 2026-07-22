import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are Thinky, an AI study tutor. Your goal is to help students learn effectively.
- Explain concepts step-by-step in a clear, encouraging way
- Adapt your explanations to the student's level
- Use examples and analogies when helpful
- Support markdown formatting, math formulas, and code blocks
- If a student asks something outside of education, gently redirect them to study topics
- Keep responses concise but thorough`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, messages, subject, topic, numQuestions, questionTypes, additionalInstructions } = await req.json();
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured. Please add the OPENAI_API_KEY secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "chat") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          stream: true,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return new Response(JSON.stringify({ error: `OpenAI error: ${err}` }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    if (action === "generate_quiz") {
      const typeDescriptions: Record<string, string> = {
        multiple_choice: "multiple choice questions with 4 options and one correct answer",
        true_false: "true/false questions",
        identification: "identification questions where the student types a short answer",
        essay: "essay questions that require a longer written response",
      };

      const requestedTypes = (questionTypes || ["multiple_choice"])
        .map((t: string) => typeDescriptions[t] || t)
        .join(", ");

      const prompt = `Generate ${numQuestions || 5} quiz questions about "${topic}" in the subject of ${subject || "General"}.
Question types: ${requestedTypes}.
${additionalInstructions ? `Additional instructions: ${additionalInstructions}.` : ""}

Return a JSON array of question objects. Each object must have:
- "question_type": one of "multiple_choice", "true_false", "identification", "essay"
- "question_text": the question
- "options": array of strings (for multiple_choice only, 4 options; empty array for other types)
- "correct_answer": the correct answer
- "explanation": a brief explanation of why the answer is correct

Return ONLY valid JSON, no markdown wrapping.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a quiz generator. Return only valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return new Response(JSON.stringify({ error: `OpenAI error: ${err}` }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { questions: [] };
      }

      const questions = parsed.questions || parsed.quiz || parsed;

      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "grade_quiz") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
