import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../entities/user.entity';
import { Address } from '../entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
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
    return this.usersRepo.save(user);
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
    return this.addressesRepo.save(address);
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.addressesRepo.findOne({
      where: { id: addressId, userId },
    });
    if (!address) return null;
    Object.assign(address, dto);
    return this.addressesRepo.save(address);
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.addressesRepo.findOne({
      where: { id: addressId, userId },
    });
    if (!address) return null;
    await this.addressesRepo.remove(address);
    return true;
  }

  async searchClients(term?: string) {
    if (!term || term.trim().length < 2) return [];
    const t = `%${term.trim()}%`;
    return this.usersRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.name', 'user.phone'])
      .where('user.role = :role', { role: 'client' })
      .andWhere('(user.email ILIKE :t OR user.name ILIKE :t)', { t })
      .orderBy('user.email', 'ASC')
      .limit(10)
      .getMany();
  }
}
