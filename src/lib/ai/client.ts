import Anthropic from '@anthropic-ai/sdk';

export class AnthropicNotConfiguredError extends Error {
  constructor() {
    super('Content generation is not configured. Set ANTHROPIC_API_KEY.');
    this.name = 'AnthropicNotConfiguredError';
  }
}

// Constructed lazily so a missing key surfaces as a clear, catchable error
// from the functions that use it instead of crashing every route that
// imports this file the moment it's evaluated.
let cachedClient: Anthropic | null | undefined;
export function getClient(): Anthropic {
  if (cachedClient === undefined) {
    cachedClient = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
  }
  if (!cachedClient) throw new AnthropicNotConfiguredError();
  return cachedClient;
}

// Sonnet-tier: strong structured-generation quality at a fraction of Opus
// cost, which matters here since weekly plan generation is a recurring
// per-business cost, not a one-off call. See the architecture plan §4.
export const MODEL = 'claude-sonnet-5';
