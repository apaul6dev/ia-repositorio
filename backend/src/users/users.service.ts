import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../entities/user.entity';
import { Address } from '../entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Address)
    private readonly addressesRepo: Repository<Address>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.usersRepo.create({
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      role: dto.role || 'client',
      passwordHash: this.hashPassword(dto.password),
    });
    const saved = await this.usersRepo.save(user);
    this.logger.log(`Usuario creado ${saved.email} role=${saved.role}`);
    return saved;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id },
      relations: { addresses: true },
    });
  }

  private hashPassword(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async listAddresses(userId: string) {
    return this.addressesRepo.find({ where: { userId } });
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    const address = this.addressesRepo.create({ ...dto, userId });
    const saved = await this.addressesRepo.save(address);
    this.logger.log(`Dirección añadida user=${userId} address=${saved.id}`);
    return saved;
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.addressesRepo.findOne({
      where: { id: addressId, userId },
    });
    if (!address) {
      this.logger.warn(`Intento de actualizar dirección inexistente ${addressId} user=${userId}`);
      return null;
    }
    Object.assign(address, dto);
    const saved = await this.addressesRepo.save(address);
    this.logger.log(`Dirección actualizada ${addressId} user=${userId}`);
    return saved;
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.addressesRepo.findOne({
      where: { id: addressId, userId },
    });
    if (!address) {
      this.logger.warn(`Intento de borrar dirección inexistente ${addressId} user=${userId}`);
      return null;
    }
    await this.addressesRepo.remove(address);
    this.logger.log(`Dirección eliminada ${addressId} user=${userId}`);
    return true;
  }

  async searchUsers(term?: string, role?: string) {
    if (!term || term.trim().length < 2) return [];
    const t = `%${term.trim()}%`;
    const qb = this.usersRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.name', 'user.phone', 'user.role'])
      .where('(user.email ILIKE :t OR user.name ILIKE :t)', { t })
      .orderBy('user.email', 'ASC')
      .limit(10);
    if (role) {
      qb.andWhere('user.role = :role', { role });
    }
    return qb.getMany();
  }
}
