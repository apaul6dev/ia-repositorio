import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  notifyShipmentStatus(shipmentId: string, status: string, target: string) {
    // In a real system, send email/SMS/push. Here we log for traceability.
    // eslint-disable-next-line no-console
    console.log(
      `[notification] shipment ${shipmentId} changed to ${status} -> ${target}`,
    );
  }
}
