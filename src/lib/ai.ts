import Anthropic from '@anthropic-ai/sdk';
import { FlipAnalysisSchema, type FlipAnalysisResult } from '@/types/flip';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Swap this for a cheaper/faster model once you've validated the prompt,
// or a stronger one if scores feel too generic. See docs.claude.com for
// current model names.
const MODEL = 'claude-sonnet-5';

export interface AnalyzeListingInput {
  title: string;
  description?: string;
  askingPrice: number;
  marketplace?: string;
  images?: { mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; base64: string }[];
}

const SYSTEM_PROMPT = `You are FlipOS's market analyst. You evaluate secondhand listings for resale
("flipping") profit potential, the way a professional reseller with years of category
experience would - not a generic assistant.

Rules:
- Ground every number and every sentence of reasoning in the SPECIFIC item described below.
  Never write advice that could apply to any random item in this category.
- Base resale estimates on realistic recently-sold prices for this exact product, condition,
  and any visible flaws or missing accessories in the photos.
- Be honest about uncertainty. If the listing is too vague to price confidently, say so in
  "confidence" and reflect it in the risk factors rather than inventing precision.
- The Flip Score (0-100) should weigh: profit margin, ROI, demand, resale competition/liquidity,
  condition, risk, and how fast it's likely to sell. A cheap item with thin absolute profit
  should not automatically outscore an expensive item with strong margin - weigh ROI and demand
  together with the profit itself.
- negotiationMessage should read like a real message a buyer would send - short, polite, and
  reference specifics of this listing.
- listingTitle/listingDescription should be ready to post as-is on the recommended platform.

You must call the submit_flip_analysis tool exactly once with your full analysis. Do not
respond in plain text.`;

const FLIP_ANALYSIS_TOOL: Anthropic.Tool = {
  name: 'submit_flip_analysis',
  description: 'Submit the structured flip analysis for this listing.',
  input_schema: {
    type: 'object',
    properties: {
      product: {
        type: 'object',
        properties: {
          identifiedProduct: { type: 'string' },
          brand: { type: ['string', 'null'] },
          category: { type: 'string' },
          conditionAssessed: { type: 'string' },
        },
        required: ['identifiedProduct', 'brand', 'category', 'conditionAssessed'],
      },
      market: {
        type: 'object',
        properties: {
          estimatedResaleValueLow: { type: 'number' },
          estimatedResaleValueHigh: { type: 'number' },
          demand: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          competition: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          confidence: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
        },
        required: ['estimatedResaleValueLow', 'estimatedResaleValueHigh', 'demand', 'competition', 'confidence'],
      },
      flipScore: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          reasoning: { type: 'string' },
        },
        required: ['score', 'reasoning'],
      },
      risk: {
        type: 'object',
        properties: {
          riskFactors: { type: 'array', items: { type: 'string' } },
          thingsToCheck: { type: 'array', items: { type: 'string' } },
          whyUnderpriced: { type: ['string', 'null'] },
        },
        required: ['riskFactors', 'thingsToCheck', 'whyUnderpriced'],
      },
      buyingStrategy: {
        type: 'object',
        properties: {
          decision: { type: 'string', enum: ['BUY', 'NEGOTIATE', 'PASS'] },
          recommendedOfferPrice: { type: ['number', 'null'] },
          negotiationMessage: { type: ['string', 'null'] },
        },
        required: ['decision', 'recommendedOfferPrice', 'negotiationMessage'],
      },
      sellingStrategy: {
        type: 'object',
        properties: {
          bestPlatform: { type: 'string' },
          recommendedSellPrice: { type: 'number' },
          listingTitle: { type: 'string' },
          listingDescription: { type: 'string' },
          keywords: { type: 'array', items: { type: 'string' } },
          photosNeeded: { type: 'array', items: { type: 'string' } },
        },
        required: ['bestPlatform', 'recommendedSellPrice', 'listingTitle', 'listingDescription', 'keywords', 'photosNeeded'],
      },
    },
    required: ['product', 'market', 'flipScore', 'risk', 'buyingStrategy', 'sellingStrategy'],
  },
};

type ContentBlock =
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'text'; text: string };

export async function analyzeListing(input: AnalyzeListingInput): Promise<FlipAnalysisResult> {
  const content: ContentBlock[] = [];

  for (const img of input.images ?? []) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
    });
  }

  content.push({
    type: 'text',
    text: [
      `Title: ${input.title}`,
      input.description ? `Description: ${input.description}` : null,
      `Asking price: $${input.askingPrice}`,
      input.marketplace ? `Marketplace: ${input.marketplace}` : null,
      'Analyze this listing as a flip opportunity.',
    ]
      .filter(Boolean)
      .join('\n'),
  });

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    tools: [FLIP_ANALYSIS_TOOL],
    tool_choice: { type: 'tool', name: 'submit_flip_analysis' },
    // Cast: our ContentBlock shape matches the API exactly, but avoids a hard
    // dependency on the SDK's exact (and version-shifting) exported type names.
    messages: [{ role: 'user', content: content as Anthropic.MessageParam['content'] }],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Model did not return a structured analysis');
  }

  // Validate against the Zod schema so a malformed model response fails loudly
  // here instead of corrupting the database.
  return FlipAnalysisSchema.parse(toolUse.input);
}
