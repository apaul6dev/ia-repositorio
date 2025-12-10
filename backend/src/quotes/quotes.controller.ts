import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { JwtOptionalGuard } from '../auth/jwt-optional.guard';
import { ReqUser } from '../auth/user.decorator';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @UseGuards(JwtOptionalGuard)
  @Post()
  create(@Body() dto: CreateQuoteDto, @ReqUser() user: any) {
    const payload = user?.sub ? { ...dto, userId: dto.userId || user.sub } : dto;
    return this.quotesService.create(payload);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.quotesService.findById(id);
  }
}
