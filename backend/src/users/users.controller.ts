import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ReqUser } from '../auth/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { JwtOptionalGuard } from '../auth/jwt-optional.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@ReqUser() user: any) {
    return this.usersService.findById(user.sub).then((u) => {
      if (!u) return null;
      const { passwordHash, ...safe } = u as any;
      return safe;
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/addresses')
  myAddresses(@ReqUser() user: any) {
    return this.usersService.listAddresses(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/addresses')
  addAddress(@ReqUser() user: any, @Body() dto: CreateAddressDto) {
    return this.usersService.addAddress(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/addresses/:id')
  updateAddress(
    @ReqUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/addresses/:id')
  deleteAddress(@ReqUser() user: any, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.sub, id);
  }

  @UseGuards(JwtOptionalGuard)
  @Get('search')
  search(@Query('q') q: string) {
    return this.usersService.searchClients(q);
  }
}
