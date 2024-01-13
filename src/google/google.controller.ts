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
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';

const client = new OAuth2Client(
  // process.env.GOOGLE_CLIENT_ID,
  // process.env.GOOGLE_CLIENT_SECRET,
  '612136221181-cdi6lu7hfd7vup2hd8vjvvbhc8q0pm8l.apps.googleusercontent.com',
  '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',
);
@Controller()
export class GoogleController {
  constructor(
    private readonly googleService: GoogleService,
    private usersService: UsersService,
  ) {}

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
