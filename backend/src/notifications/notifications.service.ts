import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  notifyShipmentStatus(shipmentId: string, status: string, target: string) {
    // In a real system, send email/SMS/push. Here we log for traceability.
    this.logger.log(
      `[notification] shipment ${shipmentId} changed to ${status} -> ${target}`,
    );
  }
}
