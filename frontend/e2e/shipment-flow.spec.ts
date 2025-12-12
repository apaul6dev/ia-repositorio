import { test, expect } from '@playwright/test';

test.describe('Flujo completo UI (login, cotizar, reservar, tracking, panel)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'op-1', email: 'op@test.com', role: 'operator' },
          accessToken: 'token-123',
          refreshToken: 'refresh-123',
        }),
      }),
    );

    await page.route('**/quotes', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'q1',
          price: 18.75,
          etaMinDays: 2,
          etaMaxDays: 4,
          serviceType: 'standard',
        }),
      }),
    );

    await page.route('**/shipments', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 's1',
              trackingCode: 'PKG-TRACK',
              status: 'created',
              originZip: '28001',
              destinationZip: '08001',
            },
          ]),
        });
      }
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 's1',
          trackingCode: 'PKG-TRACK',
          status: 'created',
        }),
      });
    });

    await page.route('**/shipments/*/tracking', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { status: 'created', changedAt: new Date().toISOString() },
          { status: 'in_transit', changedAt: new Date().toISOString(), location: 'Hub' },
        ]),
      }),
    );

    await page.route('**/ops/shipments', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 's1',
            trackingCode: 'PKG-TRACK',
            status: 'created',
            originZip: '28001',
            destinationZip: '08001',
          },
        ]),
      }),
    );

    await page.route('**/ops/shipments/*/status', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ status: 'created' }, { status: 'delivered' }]),
      }),
    );

    await page.route('**/ops/shipments/*/assign-operator', (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: '{}' }),
    );
  });

  test('operador puede cotizar, reservar y consultar tracking', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/login');

    await page.fill('input[name="email"]', 'op@test.com');
    await page.fill('input[name="password"]', 'secret123');
    await page.click('button[type="submit"]');

    await page.click('a[href="/cotizar"]');
    await page.fill('input[name="originZip"]', '28001');
    await page.fill('input[name="destinationZip"]', '08001');
    await page.fill('input[name="weightKg"]', '2');
    await page.fill('input[name="volumeM3"]', '0.05');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Precio estimado')).toBeVisible();

    await page.click('a[href="/reservar"]');
    await page.fill('input[name="quoteId"]', 'q1');
    await page.fill('input[name="originAddress"]', 'Origen 123');
    await page.fill('input[name="destinationAddress"]', 'Destino 456');
    await page.fill('input[name="originZip"]', '28001');
    await page.fill('input[name="destinationZip"]', '08001');
    await page.fill('input[name="weightKg"]', '2');
    await page.fill('input[name="volumeM3"]', '0.05');
    await page.fill('input[name="pickupDate"]', '2024-01-01');
    await page.fill('input[name="pickupSlot"]', '09-12');
    await page.fill('input[name="priceQuote"]', '18.75');
    await page.fill('input[name="priceFinal"]', '18.75');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Reserva creada')).toBeVisible();

    await page.click('a[href="/tracking"]');
    await page.fill('input[placeholder="UUID o código de tracking"]', 'PKG-TRACK');
    await page.click('button:has-text("Consultar")');
    await expect(page.getByText('in_transit')).toBeVisible();

    await page.click('a[href="/admin"]');
    await expect(page.getByText('PKG-TRACK')).toBeVisible();
  });
});
