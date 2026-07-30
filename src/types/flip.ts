import { z } from 'zod';

// This schema is passed to Claude as a tool definition so the model is forced
// to return data in exactly this shape - no prose, no markdown fences to strip.
export const FlipAnalysisSchema = z.object({
  product: z.object({
    identifiedProduct: z.string().describe('Specific product name/model, e.g. "Sony A7 III"'),
    brand: z.string().nullable(),
    category: z.string().describe('e.g. Cameras, Furniture, Sneakers, Electronics'),
    conditionAssessed: z.string().describe('Condition inferred from photos/description'),
  }),
  market: z.object({
    estimatedResaleValueLow: z.number(),
    estimatedResaleValueHigh: z.number(),
    demand: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    competition: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  }),
  flipScore: z.object({
    score: z.number().min(0).max(100),
    reasoning: z.string().describe('2-3 sentences, specific to this exact item'),
  }),
  risk: z.object({
    riskFactors: z.array(z.string()),
    thingsToCheck: z.array(z.string()).describe('What to verify before buying'),
    whyUnderpriced: z.string().nullable(),
  }),
  buyingStrategy: z.object({
    decision: z.enum(['BUY', 'NEGOTIATE', 'PASS']),
    recommendedOfferPrice: z.number().nullable(),
    negotiationMessage: z.string().nullable().describe('Message to send the seller, written for this listing'),
  }),
  sellingStrategy: z.object({
    bestPlatform: z.string(),
    recommendedSellPrice: z.number(),
    listingTitle: z.string(),
    listingDescription: z.string(),
    keywords: z.array(z.string()),
    photosNeeded: z.array(z.string()),
  }),
});

export type FlipAnalysisResult = z.infer<typeof FlipAnalysisSchema>;

// Derived financials - computed in code, never trusted from the model,
// since profit/ROI must be internally consistent with price + resale value.
export interface FlipFinancials {
  currentPrice: number;
  estimatedResaleValue: number; // midpoint of low/high
  estimatedProfit: number;
  roi: number; // percent
}

export function computeFinancials(askingPrice: number, result: FlipAnalysisResult): FlipFinancials {
  const midResale = (result.market.estimatedResaleValueLow + result.market.estimatedResaleValueHigh) / 2;
  const estimatedProfit = midResale - askingPrice;
  const roi = askingPrice > 0 ? (estimatedProfit / askingPrice) * 100 : 0;
  return {
    currentPrice: askingPrice,
    estimatedResaleValue: Math.round(midResale),
    estimatedProfit: Math.round(estimatedProfit),
    roi: Math.round(roi * 10) / 10,
  };
}

export function flipCategoryFromScore(score: number): 'EXCEPTIONAL' | 'STRONG' | 'AVERAGE' | 'WEAK' | 'AVOID' {
  if (score >= 90) return 'EXCEPTIONAL';
  if (score >= 75) return 'STRONG';
  if (score >= 50) return 'AVERAGE';
  if (score >= 25) return 'WEAK';
  return 'AVOID';
}

export const FLIP_CATEGORY_LABEL: Record<string, string> = {
  EXCEPTIONAL: 'Exceptional Flip',
  STRONG: 'Strong Flip',
  AVERAGE: 'Average Flip',
  WEAK: 'Weak Flip',
  AVOID: 'Avoid',
};
