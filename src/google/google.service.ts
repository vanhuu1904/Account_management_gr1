import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response, response } from 'express';
import ms from 'ms';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
// import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GoogleService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}
  loginGoogle = async (email: string, name: string, response: Response) => {
    const userExists = await this.usersService.findOneByEmail(email);
    if (!userExists) {
      const createdUser = this.usersService.createANewUser(email, name);
      const payload = {
        sub: 'token login',
        iss: 'from server',
        email,
        name,
      };
      const refresh_token = this.authService.createRefreshToken(payload);

      // Update user with refresh token
      await this.usersService.updateUserTokenWithGoogle(refresh_token, email);

      // set refresh_token as cookies
      response.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
      });

      // return {
      //   access_token: this.jwtService.sign(payload),
      //   user: {
      //     _id,
      //     username,
      //     fullname,
      //   },
      // };
      return { createdUser, access_token: this.jwtService.sign(payload) };
    } else {
      const payload = {
        sub: 'token login',
        iss: 'from server',
        email,
        name,
      };
      const refresh_token = this.authService.createRefreshToken(payload);

      // Update user with refresh token
      await this.usersService.updateUserTokenWithGoogle(refresh_token, email);

      // set refresh_token as cookies
      response.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
      });
      return { access_token: this.jwtService.sign(payload), userExists };
    }
  };
}
