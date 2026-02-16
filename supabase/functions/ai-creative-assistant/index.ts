import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

interface IdeaCard {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
  style: string;
  colorAccent: string;
}

serve(async (req) => {
  // Handle CORS preflight requests - return 200 OK immediately
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    // Check if API key is present
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not configured');
      throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your Supabase secrets.');
    }

    // Safe JSON parse: avoid "Unexpected end of JSON input" on empty/invalid body
    const raw = await req.text();
    if (!raw || !raw.trim()) {
      return new Response(JSON.stringify({
        error: 'Request body is required',
        details: 'Send a JSON body with action, and prompt/creativeBrief/brandInfo/productType as needed.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({
        error: 'Invalid JSON',
        details: 'Request body must be valid JSON.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, prompt, creativeBrief, brandInfo, productType } = body;

    let systemInstruction = '';
    let userMessage = '';

    if (action === 'rephrase') {
      // Enhanced rephrasing for image generation optimization
      systemInstruction = `You are an expert creative director and prompt engineer specializing in AI image generation. 
Your task is to transform rough creative briefs into professional, highly descriptive prompts optimized for image generation.

Guidelines:
- Make prompts vivid, specific, and visually detailed
- Include lighting, composition, style, and mood descriptors
- Add professional photography/design terminology
- Ensure the output is a single, cohesive paragraph
- Optimize for commercial/brand marketing visuals
- Keep the core message but elevate the description

Return ONLY the enhanced prompt text, no explanations or additional text.`;
      
      userMessage = `Transform this creative brief into a professional, image-generation-optimized prompt:

Original Brief: ${creativeBrief}

${brandInfo ? `Brand Context: ${JSON.stringify(brandInfo)}` : ''}
${productType ? `Product Type: ${productType}` : ''}`;

    } else if (action === 'generateIdeas') {
      // Ideation engine - generate 4 distinct prompt cards
      systemInstruction = `You are an innovative creative strategist generating unique campaign concepts. 
Create exactly 4 distinct visual concepts, each with a different creative approach.

Each concept MUST follow one of these categories (use exactly these category names):
1. "Minimalist" - Clean, simple, elegant with lots of negative space
2. "Cinematic" - Dramatic, movie-like, epic lighting and composition
3. "Vibrant" - Bold colors, energetic, dynamic and eye-catching
4. "Professional" - Corporate, trustworthy, refined and polished

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "ideas": [
    {
      "id": "1",
      "category": "Minimalist",
      "title": "Short catchy title (max 5 words)",
      "description": "2-3 sentence concept description",
      "prompt": "Detailed image generation prompt (50-100 words describing the visual)",
      "style": "Style keywords separated by • (e.g., Clean • Minimal • Elegant)",
      "colorAccent": "#hexcolor"
    },
    {
      "id": "2",
      "category": "Cinematic",
      "title": "...",
      "description": "...",
      "prompt": "...",
      "style": "...",
      "colorAccent": "#hexcolor"
    },
    {
      "id": "3",
      "category": "Vibrant",
      "title": "...",
      "description": "...",
      "prompt": "...",
      "style": "...",
      "colorAccent": "#hexcolor"
    },
    {
      "id": "4",
      "category": "Professional",
      "title": "...",
      "description": "...",
      "prompt": "...",
      "style": "...",
      "colorAccent": "#hexcolor"
    }
  ]
}`;
      
      userMessage = creativeBrief ? 
        `Based on this creative brief, generate 4 unique visual concepts (one for each category: Minimalist, Cinematic, Vibrant, Professional):

Brief: ${creativeBrief}
${brandInfo ? `Brand: ${JSON.stringify(brandInfo)}` : ''}
${productType ? `Product: ${productType}` : ''}

Remember: Return ONLY valid JSON with exactly 4 ideas.` :
        `Generate 4 innovative advertising visual concepts for a modern brand (one for each category: Minimalist, Cinematic, Vibrant, Professional).
${brandInfo ? `Brand: ${JSON.stringify(brandInfo)}` : ''}
${productType ? `Product: ${productType}` : ''}

Remember: Return ONLY valid JSON with exactly 4 ideas.`;

    } else if (action === 'generatePrompt') {
      // Generate a single optimized prompt from selected idea
      systemInstruction = `You are an expert at creating detailed, professional prompts for AI image generation.
Create a single, highly detailed prompt optimized for generating stunning commercial visuals.
Return ONLY the prompt text, nothing else.`;
      
      userMessage = `Create a detailed image generation prompt based on:
Concept: ${prompt}
${brandInfo ? `Brand Colors: ${brandInfo.colors?.join(', ')}` : ''}
${productType ? `Product Context: ${productType}` : ''}`;
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    // Call Google Gemini API - Using gemini-2.0-flash (latest model)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    
    console.log('Calling Gemini API with model: gemini-2.0-flash');
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\n${userMessage}` }
            ]
          }
        ],
        generationConfig: {
          temperature: action === 'generateIdeas' ? 0.9 : 0.7,
          maxOutputTokens: action === 'generateIdeas' ? 2048 : 1024,
          topP: 0.95,
          topK: 40,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_ONLY_HIGH'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_ONLY_HIGH'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH'
          }
        ]
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', JSON.stringify(data));
      throw new Error(data.error?.message || `Gemini API request failed with status ${response.status}`);
    }

    // Extract the text from Gemini's response
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      console.error('No content in Gemini response:', JSON.stringify(data));
      throw new Error('No content returned from Gemini API');
    }

    let result = textContent.trim();

    // Parse JSON response for idea generation
    if (action === 'generateIdeas') {
      try {
        // Clean up the response - remove markdown code blocks if present
        let jsonString = result;
        if (jsonString.includes('```json')) {
          jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonString.includes('```')) {
          jsonString = jsonString.replace(/```\n?/g, '');
        }
        jsonString = jsonString.trim();
        
        const parsed = JSON.parse(jsonString);
        
        // Validate the structure
        if (!parsed.ideas || !Array.isArray(parsed.ideas)) {
          throw new Error('Invalid response structure: missing ideas array');
        }
        
        // Ensure we have exactly 4 ideas with correct categories
        const validCategories = ['Minimalist', 'Cinematic', 'Vibrant', 'Professional'];
        const validatedIdeas = parsed.ideas.slice(0, 4).map((idea: any, index: number) => ({
          id: String(index + 1),
          category: validCategories[index] || idea.category,
          title: idea.title || `Concept ${index + 1}`,
          description: idea.description || 'A creative visual concept',
          prompt: idea.prompt || idea.description,
          style: idea.style || 'Creative • Unique • Modern',
          colorAccent: idea.colorAccent || ['#6366F1', '#F59E0B', '#EC4899', '#3B82F6'][index]
        }));
        
        result = { ideas: validatedIdeas };
      } catch (parseError) {
        console.error('Failed to parse ideas JSON:', parseError, 'Raw response:', result);
        
        // Return a structured fallback with 4 categories
        result = {
          ideas: [
            {
              id: '1',
              category: 'Minimalist',
              title: 'Clean & Modern',
              description: 'A minimalist approach with clean lines and subtle elegance.',
              prompt: `Minimalist ${productType || 'product'} design with clean white space, subtle shadows, and elegant typography for ${brandInfo?.name || 'brand'}`,
              style: 'Clean • Minimal • Elegant',
              colorAccent: '#6366F1'
            },
            {
              id: '2',
              category: 'Cinematic',
              title: 'Epic & Dramatic',
              description: 'Cinematic visuals with dramatic lighting and movie-like composition.',
              prompt: `Cinematic ${productType || 'product'} shot with dramatic golden hour lighting, shallow depth of field, and epic scale for ${brandInfo?.name || 'brand'}`,
              style: 'Dramatic • Epic • Cinematic',
              colorAccent: '#F59E0B'
            },
            {
              id: '3',
              category: 'Vibrant',
              title: 'Bold & Energetic',
              description: 'Eye-catching design with bold colors and dynamic energy.',
              prompt: `Vibrant ${productType || 'product'} design with bold neon colors, dynamic composition, and energetic visual flow for ${brandInfo?.name || 'brand'}`,
              style: 'Bold • Colorful • Energetic',
              colorAccent: '#EC4899'
            },
            {
              id: '4',
              category: 'Professional',
              title: 'Corporate Excellence',
              description: 'Refined professional aesthetic conveying trust and expertise.',
              prompt: `Professional ${productType || 'product'} presentation with corporate aesthetics, trust-building imagery, and polished finish for ${brandInfo?.name || 'brand'}`,
              style: 'Professional • Trustworthy • Refined',
              colorAccent: '#3B82F6'
            }
          ]
        };
      }
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-creative-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process your request. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
