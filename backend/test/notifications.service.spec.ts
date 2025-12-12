import { NotificationsService } from '../src/notifications/notifications.service';

describe('NotificationsService (unit)', () => {
  const service = new NotificationsService();

  it('loggea el cambio de estado de un envío', () => {
    const spy = jest.spyOn((service as any).logger, 'log').mockImplementation(() => {});

    service.notifyShipmentStatus('s-1', 'in_transit', 'user@test.com');

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('shipment s-1 changed to in_transit -> user@test.com'),
    );
    spy.mockRestore();
  });
});
