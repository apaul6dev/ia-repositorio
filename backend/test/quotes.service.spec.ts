import { QuotesService } from '../src/quotes/quotes.service';
import { Quote } from '../src/entities/quote.entity';
import { createInMemoryRepo } from './utils/in-memory-repo';

describe('QuotesService (unit)', () => {
  const repo = createInMemoryRepo<Quote>();
  const service = new QuotesService(repo as any);

  beforeEach(() => {
    repo.data.splice(0, repo.data.length);
  });

  it('calculates price using volumetric weight and saves quote', async () => {
    const quote = await service.create({
      originZip: '11000',
      destinationZip: '28000',
      weightKg: 2,
      volumeM3: 0.25, // volumetric weight 50 kg
      serviceType: 'express',
      userId: 'client-1',
    } as any);

    expect(quote.price).toBeCloseTo(8 + 1.8 * 50, 2);
    expect(quote.etaMinDays).toBe(1);
    expect(quote.userId).toBe('client-1');
    expect(quote.id).toBeDefined();
  });

  it('retrieves a quote by id', async () => {
    const saved = await service.create({
      originZip: '01000',
      destinationZip: '02000',
      weightKg: 1.2,
      volumeM3: 0.02,
      serviceType: 'standard',
    } as any);

    const found = await service.findById(saved.id);
    expect(found?.id).toBe(saved.id);
    expect(found?.price).toBe(saved.price);
  });
});
