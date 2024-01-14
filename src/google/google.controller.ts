import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Body,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleService } from './google.service';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
const clientId =
  '612136221181-cdi6lu7hfd7vup2hd8vjvvbhc8q0pm8l.apps.googleusercontent.com';
const clientSecret = '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';
const client = new OAuth2Client(clientId, clientSecret);

@Controller()
export class GoogleController {
  constructor(
    private readonly googleService: GoogleService,
    private usersService: UsersService,
  ) {}
  // @Public()
  // @Get()
  // @UseGuards(AuthGuard('google'))
  // async googleAuth(@Req() req) {}

  // @Public()
  // @Get('/redirect')
  // @UseGuards(AuthGuard('google'))
  // googleAuthRedirect(@Req() req) {
  //   return this.googleService.googleLogin(req);
  // }

  @ResponseMessage('Login with Google successfully')
  @Public()
  @Post('/google')
  async login(
    @Body('token') token,
    @Res({ passthrough: true }) response: Response,
  ) {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience:
        '612136221181-cdi6lu7hfd7vup2hd8vjvvbhc8q0pm8l.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
    const data = await this.googleService.loginGoogle(
      payload.email,
      payload.name,
      response,
    );
    console.log('>>> check data: ', data);
    return data;
  }
}
