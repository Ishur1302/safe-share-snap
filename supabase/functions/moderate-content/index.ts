import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageFile } = await req.json();

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing image with AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a content moderation AI for a women's safety platform. Analyze images for:
1. Nudity or sexually explicit content
2. Violence or graphic content
3. Harassment or threatening imagery
4. Any content that could be used for abuse

Respond in JSON format:
{
  "isFlagged": boolean,
  "reason": "brief explanation if flagged",
  "confidence": number (0-1)
}

Be strict but fair. Prioritize safety.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image for inappropriate content:",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageFile,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI moderation failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received:", data);

    const content = data.choices[0].message.content;
    
    let result;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: try to extract values manually
      const isFlagged = content.toLowerCase().includes('"isflagged": true') ||
                        content.toLowerCase().includes('inappropriate') ||
                        content.toLowerCase().includes('explicit') ||
                        content.toLowerCase().includes('nude');
      
      // Try to extract confidence from the response
      const confMatch = content.match(/"confidence":\s*([\d.]+)/);
      const confidence = confMatch ? parseFloat(confMatch[1]) : 0.8;
      
      result = {
        isFlagged,
        reason: isFlagged ? "Content flagged by AI moderator" : "Content appears safe",
        confidence,
      };
    }

    console.log("Moderation result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in moderate-content function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
