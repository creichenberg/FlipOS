import { Resend } from 'resend';

export class EmailNotConfiguredError extends Error {
  constructor() {
    super('Email alerts are not configured. Set RESEND_API_KEY.');
    this.name = 'EmailNotConfiguredError';
  }
}

let cachedClient: Resend | null | undefined;

function getClient(): Resend {
  if (cachedClient === undefined) {
    cachedClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  }
  if (!cachedClient) throw new EmailNotConfiguredError();
  return cachedClient;
}

export interface AlertDeal {
  title: string;
  price: number;
  estimatedProfit: number;
  roi: number;
  flipScore: number;
  itemWebUrl: string;
}

function renderDealAlertHtml(savedSearchName: string, deals: AlertDeal[]): string {
  const rows = deals
    .map(
      (d) => `
        <tr>
          <td style="padding:12px 0;border-top:1px solid #e5e5e5;">
            <a href="${d.itemWebUrl}" style="color:#121212;font-weight:600;text-decoration:none;">${d.title}</a>
            <div style="color:#8a8985;font-size:13px;margin-top:4px;">
              Flip Score ${d.flipScore}/100 &middot; Buy $${d.price.toLocaleString()} &middot;
              <span style="color:${d.estimatedProfit >= 0 ? '#1e9e5c' : '#dc4c4c'};">
                ${d.estimatedProfit >= 0 ? '+' : ''}$${d.estimatedProfit.toLocaleString()} (${d.roi.toFixed(0)}% ROI)
              </span>
            </div>
          </td>
        </tr>`
    )
    .join('');

  return `
    <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="color:#121212;">New flips for "${savedSearchName}"</h2>
      <p style="color:#8a8985;">FlipOS found ${deals.length} new listing${deals.length === 1 ? '' : 's'} matching your saved search.</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
    </div>`;
}

export async function sendDealAlertEmail(params: { to: string; savedSearchName: string; deals: AlertDeal[] }): Promise<void> {
  const client = getClient();
  const from = process.env.ALERT_FROM_EMAIL || 'FlipOS Alerts <alerts@flipos.app>';

  await client.emails.send({
    from,
    to: params.to,
    subject: `${params.deals.length} new flip${params.deals.length === 1 ? '' : 's'} found for "${params.savedSearchName}"`,
    html: renderDealAlertHtml(params.savedSearchName, params.deals),
  });
}
