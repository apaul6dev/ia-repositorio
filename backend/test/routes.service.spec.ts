import { NotFoundException } from '@nestjs/common';
import { RoutesService } from '../src/routes/routes.service';
import { createInMemoryRepo } from './utils/in-memory-repo';
import { Route } from '../src/entities/route.entity';
import { RouteAssignment } from '../src/entities/route-assignment.entity';

describe('RoutesService (unit)', () => {
  const routesRepo = createInMemoryRepo<Route>();
  const assignmentsRepo = createInMemoryRepo<RouteAssignment>();
  const shipmentsService = { assignRoute: jest.fn() };
  let service: RoutesService;

  beforeEach(() => {
    routesRepo.data.splice(0, routesRepo.data.length);
    assignmentsRepo.data.splice(0, assignmentsRepo.data.length);
    shipmentsService.assignRoute = jest.fn();
    service = new RoutesService(
      routesRepo as any,
      assignmentsRepo as any,
      shipmentsService as any,
    );
  });

  it('crea rutas y las lista', async () => {
    await service.create({
      name: 'Ruta Norte',
      region: 'Norte',
      vehicle: 'Van',
      capacity: 10,
    });

    const routes = await service.findAll();

    expect(routes.length).toBe(1);
    expect(routes[0].name).toBe('Ruta Norte');
    expect(routes[0].vehicle).toBe('Van');
  });

  it('lanza error al asignar si la ruta no existe', async () => {
    await expect(service.assign('missing', { shipmentId: 's1' } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('delegates la asignación al ShipmentsService cuando la ruta existe', async () => {
    const route = await routesRepo.save({
      id: 'r-1',
      name: 'Ruta Centro',
      region: 'Centro',
      vehicle: 'Truck',
      capacity: 20,
    } as Route);
    (shipmentsService.assignRoute as jest.Mock).mockResolvedValue({
      id: 'assign-1',
      routeId: route.id,
      shipmentId: 's-9',
    });

    const result = await service.assign(route.id, { shipmentId: 's-9' } as any);

    expect(shipmentsService.assignRoute).toHaveBeenCalledWith('s-9', route.id);
    expect(result.routeId).toBe(route.id);
  });

  it('lista asignaciones filtradas por ruta', async () => {
    await assignmentsRepo.save({ id: 'a1', routeId: 'r-1', shipmentId: 's-1' } as RouteAssignment);
    await assignmentsRepo.save({ id: 'a2', routeId: 'r-2', shipmentId: 's-2' } as RouteAssignment);

    const list = await service.listAssignments('r-1');

    expect(list.length).toBe(1);
    expect(list[0].routeId).toBe('r-1');
  });
});
