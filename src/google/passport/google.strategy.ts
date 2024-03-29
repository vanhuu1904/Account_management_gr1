import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID:
        '612136221181-cdi6lu7hfd7vup2hd8vjvvbhc8q0pm8l.apps.googleusercontent.com',
      clientSecret: configService.get<string>('GOOGLE_APP_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_REDIRECT'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('>>> check profile: ', profile);
    const type = 'GOOGLE';
    let dataRaw = {
      fullname: profile.displayName,
      username:
        profile.emails && profile.emails.length > 0
          ? profile.emails[0].value
          : profile.id,
    };
    let user = this.usersService.upsertUserGoogle(type, dataRaw);
    done(null, user);
  }
}
