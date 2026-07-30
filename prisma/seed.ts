import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const user = await db.user.upsert({
    where: { email: 'demo@flipos.app' },
    update: {},
    create: { email: 'demo@flipos.app', name: 'Demo Flipper' },
  });

  const samples = [
    {
      title: 'Sony A7 III Camera Body',
      description: 'Used, some shelf wear, comes with battery and charger.',
      askingPrice: 650,
      marketplace: 'eBay',
      analysis: {
        identifiedProduct: 'Sony A7 III',
        brand: 'Sony',
        category: 'Cameras',
        conditionAssessed: 'Used - light cosmetic wear, fully functional',
        estimatedResaleValueLow: 850,
        estimatedResaleValueHigh: 950,
        demand: 'HIGH' as const,
        competition: 'MEDIUM' as const,
        confidence: 'HIGH' as const,
        flipScore: 92,
        flipReasoning:
          'Priced well below recent sold listings for this body with matching accessories. Demand for the A7 III stays strong among hybrid shooters; verify shutter count before buying.',
        riskFactors: ['Shutter count unknown', 'No lens included, limits buyer pool slightly'],
        thingsToCheck: ['Ask for shutter actuation count', 'Test all dials and the LCD hinge', 'Confirm sensor has no dust or scratches'],
        whyUnderpriced: 'Seller listed as "camera" without model-specific keywords, so it is getting less search traffic than it should.',
        buyDecision: 'BUY' as const,
        recommendedOfferPrice: 600,
        negotiationMessage: "Hi! Is the A7 III still available? Would you take $600 for it today if I can pick up this week?",
        bestPlatform: 'eBay',
        recommendedSellPrice: 899,
        listingTitle: 'Sony A7 III Full-Frame Mirrorless Camera Body - Excellent Condition',
        listingDescription:
          'Sony A7 III body in excellent working condition. Light cosmetic wear consistent with careful use, sensor clean, all functions tested. Includes original battery and charger.',
        keywords: ['sony a7iii', 'full frame mirrorless', 'sony alpha'],
        photosNeeded: ['Front of body', 'Top dials', 'LCD screen on', 'Sensor with cap off', 'Included accessories'],
      },
    },
    {
      title: 'Canon EOS R6 with 24-105mm lens',
      description: 'Barely used, upgrading to R6 Mark II.',
      askingPrice: 400,
      marketplace: 'Facebook Marketplace',
      analysis: {
        identifiedProduct: 'Canon EOS R6 + RF 24-105mm f/4L',
        brand: 'Canon',
        category: 'Cameras',
        conditionAssessed: 'Like new',
        estimatedResaleValueLow: 600,
        estimatedResaleValueHigh: 700,
        demand: 'HIGH' as const,
        competition: 'MEDIUM' as const,
        confidence: 'MEDIUM' as const,
        flipScore: 94,
        flipReasoning:
          'Kit price is far below the body-only used price, meaning the lens is essentially free. Very high demand pairing that typically sells within days.',
        riskFactors: ['Price seems unusually low for a working kit - confirm it is not water/impact damaged'],
        thingsToCheck: ['Ask for a shutter count', 'Test autofocus in low light', 'Check lens glass for fungus or scratches'],
        whyUnderpriced: 'Seller likely wants a fast local sale over maximizing price.',
        buyDecision: 'BUY' as const,
        recommendedOfferPrice: 380,
        negotiationMessage: 'Hi, is this still available? I can pay cash and pick up today if you can do $380.',
        bestPlatform: 'eBay',
        recommendedSellPrice: 649,
        listingTitle: 'Canon EOS R6 Body + RF 24-105mm f/4L Kit - Like New',
        listingDescription:
          'Canon EOS R6 with RF 24-105mm f/4L lens, like-new condition. Low shutter count, no signs of use. Great low-light hybrid photo/video body.',
        keywords: ['canon eos r6', 'rf 24-105', 'canon mirrorless kit'],
        photosNeeded: ['Body front and back', 'Lens front element', 'LCD screen on', 'Battery and card door'],
      },
    },
  ];

  for (const s of samples) {
    const listing = await db.listing.create({
      data: {
        userId: user.id,
        title: s.title,
        description: s.description,
        askingPrice: s.askingPrice,
        marketplace: s.marketplace,
      },
    });

    const { flipReasoning, ...rest } = s.analysis;
    await db.flipAnalysis.create({
      data: {
        listingId: listing.id,
        identifiedProduct: rest.identifiedProduct,
        brand: rest.brand,
        category: rest.category,
        conditionAssessed: rest.conditionAssessed,
        estimatedResaleValueLow: rest.estimatedResaleValueLow,
        estimatedResaleValueHigh: rest.estimatedResaleValueHigh,
        demand: rest.demand,
        competition: rest.competition,
        confidence: rest.confidence,
        estimatedProfit:
          (rest.estimatedResaleValueLow + rest.estimatedResaleValueHigh) / 2 - s.askingPrice,
        roi:
          (((rest.estimatedResaleValueLow + rest.estimatedResaleValueHigh) / 2 - s.askingPrice) /
            s.askingPrice) *
          100,
        flipScore: rest.flipScore,
        flipCategory: rest.flipScore >= 90 ? 'EXCEPTIONAL' : 'STRONG',
        flipReasoning,
        riskFactors: rest.riskFactors,
        thingsToCheck: rest.thingsToCheck,
        whyUnderpriced: rest.whyUnderpriced,
        buyDecision: rest.buyDecision,
        recommendedOfferPrice: rest.recommendedOfferPrice,
        negotiationMessage: rest.negotiationMessage,
        bestPlatform: rest.bestPlatform,
        recommendedSellPrice: rest.recommendedSellPrice,
        listingTitle: rest.listingTitle,
        listingDescription: rest.listingDescription,
        keywords: rest.keywords,
        photosNeeded: rest.photosNeeded,
        rawModelOutput: rest,
      },
    });
  }

  console.log('Seeded demo user + sample flips');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
