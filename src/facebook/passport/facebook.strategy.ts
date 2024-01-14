import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: '393993129750751',
      clientSecret: 'caabe9dd5796bb6ff36178ef1a1a69f8',
      callbackURL: 'http://localhost:8000/facebook/redirect',
      scope: 'email',
      profileFields: ['emails', 'name', 'id'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    console.log('>>> check profile: ', profile);
    const type = 'FACEBOOK';
    let dataRaw = {
      fullname: profile.displayName,
      username:
        profile.emails && profile.emails.length > 0
          ? profile.emails[0].value
          : profile.id,
    };
    let user = this.usersService.upsertUserFacebook(type, dataRaw);
    done(null, user);
  }
}
