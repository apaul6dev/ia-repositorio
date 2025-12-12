import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createInMemoryRepo } from './utils/in-memory-repo';
import { ShipmentsService } from '../src/shipments/shipments.service';
import { Shipment } from '../src/entities/shipment.entity';
import { ShipmentStatus } from '../src/entities/shipment-status.entity';
import { Quote } from '../src/entities/quote.entity';
import { Route } from '../src/entities/route.entity';
import { RouteAssignment } from '../src/entities/route-assignment.entity';
import { User } from '../src/entities/user.entity';

describe('ShipmentsService (unit)', () => {
  const shipmentsRepo = createInMemoryRepo<Shipment>();
  const statusRepo = createInMemoryRepo<ShipmentStatus>();
  const quotesRepo = createInMemoryRepo<Quote>();
  const routesRepo = createInMemoryRepo<Route>();
  const assignmentsRepo = createInMemoryRepo<RouteAssignment>();
  const usersRepo = createInMemoryRepo<User>();
  const notificationsService = { notifyShipmentStatus: jest.fn() };

  let service: ShipmentsService;
  let baseQuote: Quote;

  beforeEach(async () => {
    shipmentsRepo.data.splice(0, shipmentsRepo.data.length);
    statusRepo.data.splice(0, statusRepo.data.length);
    quotesRepo.data.splice(0, quotesRepo.data.length);
    routesRepo.data.splice(0, routesRepo.data.length);
    assignmentsRepo.data.splice(0, assignmentsRepo.data.length);
    usersRepo.data.splice(0, usersRepo.data.length);
    service = new ShipmentsService(
      shipmentsRepo as any,
      statusRepo as any,
      quotesRepo as any,
      routesRepo as any,
      assignmentsRepo as any,
      usersRepo as any,
      notificationsService as any,
    );
    (shipmentsRepo as any).findOne = async (options: any) => {
      const where = options?.where || {};
      const found = shipmentsRepo.data.find((s) =>
        Object.entries(where).every(([k, v]) => (s as any)[k] === v),
      );
      if (!found) return null;
      return {
        ...found,
        statusHistory: statusRepo.data.filter((st) => st.shipmentId === found.id),
      } as any;
    };
    baseQuote = await quotesRepo.save({
      id: 'quote-1',
      serviceType: 'standard',
      weightKg: 2,
      volumeM3: 0.2,
      originZip: '1000',
      destinationZip: '2000',
      price: 10,
      etaMinDays: 2,
      etaMaxDays: 4,
      expiresAt: new Date(Date.now() + 3600),
      createdAt: new Date(),
    } as Quote);
  });

  it('requires a quote to create shipments', async () => {
    await expect(service.create({} as any)).rejects.toThrow('quoteId is required');
  });

  it('throws when quote does not exist', async () => {
    await expect(service.create({ quoteId: 'missing' } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects shipments for a different user than the quote owner', async () => {
    baseQuote.userId = 'client-1';
    await quotesRepo.save(baseQuote);

    await expect(
      service.create({
        quoteId: baseQuote.id,
        userId: 'client-2',
        originAddress: 'A',
        destinationAddress: 'B',
        originZip: '1000',
        destinationZip: '2000',
        pickupDate: '2024-01-01',
        pickupSlot: 'AM',
        weightKg: 1,
        volumeM3: 0.01,
        serviceType: 'standard',
        priceQuote: 10,
        priceFinal: 10,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates shipment, status history and tracking code', async () => {
    const shipment = await service.create({
      quoteId: baseQuote.id,
      originAddress: 'Calle 1',
      destinationAddress: 'Calle 2',
      originZip: '1000',
      destinationZip: '2000',
      pickupDate: '2024-01-01',
      pickupSlot: '09-12',
      weightKg: 2,
      volumeM3: 0.2,
      serviceType: 'standard',
      priceQuote: 12,
      priceFinal: 12,
    });

    expect(shipment.id).toBeDefined();
    expect(shipment.trackingCode).toMatch(/^PKG-/);
    expect(statusRepo.data.some((s) => s.shipmentId === shipment.id && s.status === 'created')).toBe(
      true,
    );
  });

  it('adds status updates and notifies users', async () => {
    const shipment = await service.create({
      quoteId: baseQuote.id,
      originAddress: 'A',
      destinationAddress: 'B',
      originZip: '1000',
      destinationZip: '2000',
      pickupDate: '2024-01-01',
      pickupSlot: 'AM',
      weightKg: 1,
      volumeM3: 0.1,
      serviceType: 'standard',
      priceQuote: 10,
      priceFinal: 10,
    });

    const history = await service.addStatus(shipment.id, {
      status: 'in_transit',
      note: 'En ruta',
      location: 'Hub',
      changedBy: 'system',
    });

    expect(history[history.length - 1].status).toBe('in_transit');
    expect(notificationsService.notifyShipmentStatus).toHaveBeenCalledWith(
      shipment.id,
      'in_transit',
      shipment.user?.email || 'client',
    );
  });

  it('prevents operators from updating shipments not assigned to them', async () => {
    const shipment = await service.create({
      quoteId: baseQuote.id,
      originAddress: 'A',
      destinationAddress: 'B',
      originZip: '1000',
      destinationZip: '2000',
      pickupDate: '2024-01-01',
      pickupSlot: 'AM',
      weightKg: 1,
      volumeM3: 0.1,
      serviceType: 'standard',
      priceQuote: 10,
      priceFinal: 10,
    });
    shipment.operatorId = 'operator-2';
    await shipmentsRepo.save(shipment);

    await expect(
      service.updateStatusAsUser(shipment.id, { status: 'incident', note: 'test' } as any, {
        id: 'operator-1',
        role: 'operator',
        email: 'op@test.com',
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assigns and unassigns operators', async () => {
    await usersRepo.save({
      id: 'op-1',
      email: 'op@test.com',
      passwordHash: 'h',
      role: 'operator',
    } as User);
    const shipment = await service.create({
      quoteId: baseQuote.id,
      originAddress: 'A',
      destinationAddress: 'B',
      originZip: '1000',
      destinationZip: '2000',
      pickupDate: '2024-01-01',
      pickupSlot: 'AM',
      weightKg: 1,
      volumeM3: 0.1,
      serviceType: 'standard',
      priceQuote: 10,
      priceFinal: 10,
    });

    const assigned = await service.assignOperator(shipment.id, 'op-1');
    expect(assigned.operatorId).toBe('op-1');

    const unassigned = await service.assignOperator(shipment.id, null);
    expect(unassigned.operatorId).toBeNull();
  });

  it('asigna rutas a un envío existente y devuelve la asignación', async () => {
    const route = await routesRepo.save({
      id: 'route-1',
      name: 'Ruta Norte',
      region: 'Norte',
      active: true,
    } as Route);
    const shipment = await service.create({
      quoteId: baseQuote.id,
      originAddress: 'A',
      destinationAddress: 'B',
      originZip: '1000',
      destinationZip: '2000',
      pickupDate: '2024-01-01',
      pickupSlot: 'AM',
      weightKg: 1,
      volumeM3: 0.1,
      serviceType: 'standard',
      priceQuote: 10,
      priceFinal: 10,
    });

    const assignment = await service.assignRoute(shipment.id, route.id);

    expect(assignment.routeId).toBe(route.id);
    expect(assignment.shipmentId).toBe(shipment.id);
  });

  it('lanza error al asignar una ruta inexistente', async () => {
    const shipment = await service.create({
      quoteId: baseQuote.id,
      originAddress: 'Origen',
      destinationAddress: 'Destino',
      originZip: '1000',
      destinationZip: '2000',
      pickupDate: '2024-01-01',
      pickupSlot: 'AM',
      weightKg: 1,
      volumeM3: 0.1,
      serviceType: 'standard',
      priceQuote: 10,
      priceFinal: 10,
    });

    await expect(service.assignRoute(shipment.id, 'missing-route')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('recupera tracking usando trackingCode', async () => {
    const shipment = await service.create({
      quoteId: baseQuote.id,
      originAddress: 'Origen',
      destinationAddress: 'Destino',
      originZip: '1000',
      destinationZip: '2000',
      pickupDate: '2024-01-01',
      pickupSlot: 'AM',
      weightKg: 1,
      volumeM3: 0.1,
      serviceType: 'standard',
      priceQuote: 10,
      priceFinal: 10,
    });

    const history = await service.tracking(shipment.trackingCode);

    expect(history[0].status).toBe('created');
    expect(history.length).toBeGreaterThan(0);
  });

  it('setea userId desde la quote cuando corresponde', async () => {
    baseQuote.userId = 'client-quote';
    await quotesRepo.save(baseQuote);

    const shipment = await service.create({
      quoteId: baseQuote.id,
      originAddress: 'Origen',
      destinationAddress: 'Destino',
      originZip: '1000',
      destinationZip: '2000',
      pickupDate: '2024-01-01',
      pickupSlot: 'AM',
      priceQuote: 10,
      priceFinal: 10,
    } as any);

    expect(shipment.user).toEqual({ id: 'client-quote' });
  });

  it('findAll construye filtros con query builder', async () => {
    const andWhere = jest.fn().mockReturnThis();
    const leftJoin = jest.fn().mockReturnThis();
    const leftJoinAndSelect = jest.fn().mockReturnThis();
    const orderBy = jest.fn().mockReturnThis();
    const getMany = jest.fn().mockResolvedValue([]);
    (shipmentsRepo as any).createQueryBuilder = jest.fn().mockReturnValue({
      leftJoinAndSelect,
      leftJoin,
      orderBy,
      andWhere,
      getMany,
    });

    await service.findAll({
      status: 'created' as any,
      userId: 'u-1',
      operatorId: 'op-1',
      routeId: 'route-1',
      dateFrom: '2024-01-01',
      dateTo: '2024-02-01',
    });

    expect(leftJoinAndSelect).toHaveBeenCalledWith('shipment.user', 'user');
    expect(andWhere).toHaveBeenCalledWith('shipment.status = :status', { status: 'created' });
    expect(leftJoin).toHaveBeenCalledWith('shipment.assignments', 'assignments');
    expect(andWhere).toHaveBeenCalledWith('assignments.routeId = :routeId', {
      routeId: 'route-1',
    });
    expect(getMany).toHaveBeenCalled();
  });

  it('lanza NotFound cuando no existe shipment (findOne/tracking/addStatus)', async () => {
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.tracking('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.addStatus('missing', { status: 'incident' } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lanza NotFound cuando la ruta o el envío no existen al asignar', async () => {
    await expect(service.assignRoute('missing-shipment', 'route-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await routesRepo.save({ id: 'route-2', name: 'Ruta', active: true } as Route);
    const created = await service.create({
      quoteId: baseQuote.id,
      originAddress: 'A',
      destinationAddress: 'B',
      originZip: '1000',
      destinationZip: '2000',
      pickupDate: '2024-01-01',
      pickupSlot: 'AM',
      weightKg: 1,
      volumeM3: 0.1,
      serviceType: 'standard',
      priceQuote: 10,
      priceFinal: 10,
    });
    await expect(service.assignRoute(created.id, 'missing-route')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lanza NotFound cuando el operador no existe al asignar', async () => {
    const shipment = await service.create({
      quoteId: baseQuote.id,
      originAddress: 'A',
      destinationAddress: 'B',
      originZip: '1000',
      destinationZip: '2000',
      pickupDate: '2024-01-01',
      pickupSlot: 'AM',
      weightKg: 1,
      volumeM3: 0.1,
      serviceType: 'standard',
      priceQuote: 10,
      priceFinal: 10,
    });

    await expect(service.assignOperator(shipment.id, 'missing-operator')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('actualiza estado cuando operador asignado coincide', async () => {
    await usersRepo.save({
      id: 'op-2',
      email: 'op2@test.com',
      passwordHash: 'h',
      role: 'operator',
    } as User);
    const shipment = await service.create({
      quoteId: baseQuote.id,
      originAddress: 'A',
      destinationAddress: 'B',
      originZip: '1000',
      destinationZip: '2000',
      pickupDate: '2024-01-01',
      pickupSlot: 'AM',
      weightKg: 1,
      volumeM3: 0.1,
      serviceType: 'standard',
      priceQuote: 10,
      priceFinal: 10,
    });
    await service.assignOperator(shipment.id, 'op-2');
    const addStatusSpy = jest.spyOn(service as any, 'addStatus');

    await service.updateStatusAsUser(
      shipment.id,
      { status: 'in_transit', note: 'ok' } as any,
      { id: 'op-2', role: 'operator', email: 'op2@test.com' } as any,
    );

    expect(addStatusSpy).toHaveBeenCalledWith(
      shipment.id,
      expect.objectContaining({ status: 'in_transit', changedBy: 'op2@test.com' }),
    );
  });
});
