import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// 2026 stable model for image generation
const MODEL_ID = 'gemini-2.5-flash-image';

// Product type to industry mapping for better context
const PRODUCT_TYPE_CONTEXT: Record<string, { industry: string; style: string; negative: string }> = {
  'Logo': {
    industry: 'Brand Identity & Design',
    style: 'Clean, centered, iconic vector-style mark on a minimalist background. Bold, memorable, scalable.',
    negative: 'cluttered backgrounds, complex illustrations, photorealistic elements, text-heavy designs'
  },
  'SaaS': {
    industry: 'Technology & Software',
    style: 'Sleek, modern UI/UX interface mockup, dashboard visualization, clean data presentation.',
    negative: 'generic blue tech buildings, clipart, dated 2010s flat design'
  },
  'Mobile App': {
    industry: 'Mobile Technology',
    style: 'Smartphone mockup with elegant UI, app store hero image, clean gradients and modern icons.',
    negative: 'generic stock phones, outdated iOS/Android designs, cluttered interfaces'
  },
  'Social Media': {
    industry: 'Digital Marketing',
    style: 'Vibrant, eye-catching social post, Instagram/TikTok optimized, bold typography, trending aesthetics.',
    negative: 'boring corporate layouts, text walls, low engagement visuals'
  },
  'E-commerce': {
    industry: 'Retail & Commerce',
    style: 'Product showcase, lifestyle photography, clean white backgrounds, luxury feel.',
    negative: 'cheap looking products, messy backgrounds, amateur photography'
  },
  'Marketing Visual': {
    industry: 'Advertising & Marketing',
    style: 'High-end commercial photography, hero image quality, professional studio lighting.',
    negative: 'stock photo feel, generic business imagery, cheesy corporate poses'
  },
  'Website': {
    industry: 'Web Design',
    style: 'Modern landing page hero, above-the-fold section, compelling visual hierarchy.',
    negative: 'dated web designs, cluttered layouts, poor typography'
  },
  'Presentation': {
    industry: 'Business Communications',
    style: 'Clean slide design, executive presentation quality, data visualization, minimal text.',
    negative: 'PowerPoint clipart, dense text blocks, amateur layouts'
  },
};

// Build the Master Template prompt
function buildMasterPrompt(payload: {
  brandSource: string;
  brandName: string;
  brandColors: string[];
  productType: string;
  brandLogo: string | null;
  brandFont: string;
  creativeBrief: string;
}): string {
  const { brandName, brandColors, productType, creativeBrief, brandFont } = payload;
  
  // Get product-specific context or use defaults
  const context = PRODUCT_TYPE_CONTEXT[productType] || PRODUCT_TYPE_CONTEXT['Marketing Visual'];
  
  // Build color string
  const colorString = brandColors.length > 0 
    ? brandColors.join(', ') 
    : '#7C3AED, #3B82F6';

  // Master Template - enforces strict adherence to ALL user inputs
  const masterPrompt = `
VISUAL STYLE GUIDE: ${productType} high-end commercial imagery.

BRAND CONTEXT: Created for "${brandName}", a brand in the ${context.industry} space.
Typography: ${brandFont} font family aesthetic - match its personality in any text or design elements.

CORE SUBJECT: ${creativeBrief}

COLOR REQUIREMENTS: The visual MUST primarily use these brand colors: ${colorString}. 
- Use them for accents, lighting, key elements, and overall color grading.
- These colors should be prominently visible and define the visual's palette.

COMPOSITIONAL DIRECTIVES:
${context.style}

TECHNICAL REQUIREMENTS:
- Professional studio lighting
- 8K resolution, ultra-sharp focus
- Commercial photography quality
- High dynamic range
- Clean, polished finish

STRICT NEGATIVE CONSTRAINTS (AVOID):
- ${context.negative}
- Generic blue tech buildings
- Generic "business men" in suits
- Any elements that contradict the ${context.industry} vibe
- Watermarks, signatures, or text artifacts
- Low quality, blurry, or pixelated elements
`.trim();

  return masterPrompt;
}

// Soften prompt for safety filter retry
function softenPrompt(originalPrompt: string): string {
  // Add safety-friendly modifiers and remove potentially problematic phrases
  const softenedAdditions = `
Create a professional, brand-safe, family-friendly visualization.
Focus on abstract concepts, shapes, and professional aesthetics.
Use symbolic representation rather than literal depiction.
Emphasize clean design, modern aesthetics, and brand identity.
`;
  
  // Remove potentially problematic words/phrases
  let softened = originalPrompt
    .replace(/\b(violent|weapon|blood|gore|adult|explicit|nude|naked|sexy|sensual)\b/gi, 'professional')
    .replace(/\b(kill|death|dead|die|dying)\b/gi, 'transform')
    .replace(/\b(drug|alcohol|smoke|smoking|cigarette)\b/gi, 'wellness')
    .replace(/\b(hate|racist|discrimination)\b/gi, 'unity');
  
  return `${softenedAdditions}\n\n${softened}`;
}

// Generate image with Gemini API
async function generateWithGemini(prompt: string, geminiApiKey: string): Promise<{ 
  success: boolean; 
  imageData?: string; 
  mimeType?: string; 
  error?: string;
  safetyFiltered?: boolean;
}> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${geminiApiKey}`;

  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ["IMAGE"]  // MANDATORY for image output
    }
  };

  console.log('Calling Gemini API...');
  console.log('Prompt length:', prompt.length);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  // Check if response is OK
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Response:', response.status, errorText);
    
    let errorMessage = `Gemini API error: ${response.status}`;
    
    if (errorText) {
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson?.error?.message || errorMessage;
      } catch {
        errorMessage = errorText.substring(0, 200);
      }
    }
    
    return { success: false, error: errorMessage };
  }

  // Get raw text response first
  const rawText = await response.text();
  
  if (!rawText || rawText.trim() === '') {
    console.error('Empty response body from Gemini API');
    return { success: false, error: 'Empty response from Gemini API' };
  }

  console.log('Response length:', rawText.length);

  // Parse JSON with try/catch
  let result;
  try {
    result = JSON.parse(rawText);
  } catch (parseError) {
    console.error('JSON Parse Error. Raw response:', rawText.substring(0, 500));
    return { success: false, error: 'Failed to parse Gemini response' };
  }

  // Check for safety filter
  const finishReason = result?.candidates?.[0]?.finishReason;
  if (finishReason === 'SAFETY') {
    console.log('Content blocked by safety filter');
    return { success: false, safetyFiltered: true, error: 'Content blocked by safety filters' };
  }

  // Extract image from response
  const parts = result?.candidates?.[0]?.content?.parts;
  
  if (!Array.isArray(parts) || parts.length === 0) {
    console.error('No parts in response:', JSON.stringify(result).substring(0, 500));
    return { success: false, error: 'No content generated' };
  }

  // Find the image part
  const imagePart = parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData);
  const base64Data = imagePart?.inlineData?.data;
  const mimeType = imagePart?.inlineData?.mimeType || 'image/png';

  if (!base64Data) {
    const textPart = parts.find((p: { text?: string }) => p.text);
    if (textPart?.text) {
      console.log('Received text instead of image:', textPart.text.substring(0, 200));
      return { success: false, error: `Image generation failed: ${textPart.text.substring(0, 100)}` };
    }
    return { success: false, error: 'No image data in response' };
  }

  return { success: true, imageData: base64Data, mimeType };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured. Please add it to Supabase secrets.');
    }

    // Safe JSON parse: avoid "Unexpected end of JSON input" on empty/invalid body
    const raw = await req.text();
    if (!raw || !raw.trim()) {
      return new Response(
        JSON.stringify({
          error: 'Request body is required',
          details: 'Send a JSON body with creativeBrief or prompt, plus brand/product fields.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON', details: 'Request body must be valid JSON.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract ALL user inputs from the payload
    const {
      // From Step 1 (Brand)
      brandSource = 'library',
      brandName = 'Brand',
      brandColors = [],
      productType = 'Marketing Visual',
      brandLogo = null,
      brandFont = 'Outfit',
      
      // From Step 2 (Creative)
      creativeBrief = '',
      
      // Legacy support
      prompt: legacyPrompt,
      style = 'professional',
    } = body;

    // Use creative brief or legacy prompt
    const finalBrief = creativeBrief || legacyPrompt || `Professional ${productType} visual for ${brandName}`;

    if (!finalBrief) {
      return new Response(
        JSON.stringify({ error: 'Creative brief or prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== Image Generation Request ===');
    console.log('Brand Source:', brandSource);
    console.log('Brand Name:', brandName);
    console.log('Brand Colors:', brandColors);
    console.log('Product Type:', productType);
    console.log('Brand Font:', brandFont);
    console.log('Has Logo:', !!brandLogo);
    console.log('Creative Brief:', finalBrief.substring(0, 100));

    // Build the Master Template prompt with ALL user inputs
    const masterPrompt = buildMasterPrompt({
      brandSource,
      brandName,
      brandColors,
      productType,
      brandLogo,
      brandFont,
      creativeBrief: finalBrief,
    });

    console.log('=== Master Prompt Built ===');
    console.log('Length:', masterPrompt.length);

    // Attempt 1: Generate with full prompt
    let result = await generateWithGemini(masterPrompt, geminiApiKey);

    // If safety filtered, attempt ONE automatic softened retry
    if (result.safetyFiltered) {
      console.log('=== Safety Filter Triggered - Attempting Softened Retry ===');
      
      const softenedPrompt = softenPrompt(masterPrompt);
      console.log('Softened prompt length:', softenedPrompt.length);
      
      result = await generateWithGemini(softenedPrompt, geminiApiKey);
      
      // If still safety filtered after softening, return error to user
      if (result.safetyFiltered) {
        console.log('Softened retry also blocked by safety filter');
        return new Response(
          JSON.stringify({
            error: 'Content filtered',
            details: 'Your prompt was blocked by safety filters even after softening. Please try a completely different concept that focuses on abstract brand elements.',
            safetyFiltered: true,
            retryable: false
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for other errors
    if (!result.success) {
      throw new Error(result.error || 'Image generation failed');
    }

    console.log('=== Image Generated Successfully ===');
    console.log('MIME Type:', result.mimeType);
    console.log('Data length:', result.imageData?.length);

    // Return success response
    return new Response(
      JSON.stringify({
        imageUrl: `data:${result.mimeType};base64,${result.imageData}`,
        prompt: finalBrief,
        provider: 'Gemini 2.5 Flash',
        brandContext: {
          name: brandName,
          colors: brandColors,
          productType,
          font: brandFont,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('=== Generation Error ===');
    console.error(message);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate image',
        details: message,
        retryable: true
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
