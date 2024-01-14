import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Req,
  Redirect,
} from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('facebook')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}
  @Public()
  @Redirect('http://localhost:3000/admin')
  @Get()
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin(): Promise<any> {
    return HttpStatus.OK;
  }
  @Public()
  @Get('/redirect')
  @Redirect('http://localhost:3000/admin')
  @UseGuards(AuthGuard('facebook'))
  async facebookLoginRedirect(@Req() req: Request): Promise<any> {
    return {
      statusCode: HttpStatus.OK,
      data: req.user,
    };
  }
}
