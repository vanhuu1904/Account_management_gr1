import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { Response } from 'express';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  //   username / pass là 2 tham số thư viện passport trả về
  //   hàm kiểm tra xem có đăng nhập đúng không
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (user) {
      const isValid = this.usersService.isValidPassword(pass, user.password);
      if (isValid === true) {
        return user;
      }
    }
    return null;
  }

  async login(user: IUser, response: Response) {
    const { _id, username, fullname } = user;
    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id,
      username,
      fullname,
    };
    const refresh_token = this.createRefreshToken(payload);

    // Update user with refresh token
    await this.usersService.updateUserToken(refresh_token, _id);

    // set refresh_token as cookies
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        username,
        fullname,
      },
    };
  }
  async register(user: RegisterUserDto) {
    let newUser = await this.usersService.register(user);
    return {
      id: newUser?.id,
      createdAt: newUser.createdAt,
    };
  }

  createRefreshToken = (payload: any) => {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')) / 1000,
    });
    return refresh_token;
  };

  processNewToken = async (refresh_token: string, response: Response) => {
    try {
      this.jwtService.verify(refresh_token, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      let user = await this.usersService.findUserByToken(refresh_token);
      if (user) {
        const { _id, username, fullname } = user;
        const payload = {
          sub: 'token refresh',
          iss: 'from server',
          _id,
          username,
          fullname,
        };
        const refresh_token = this.createRefreshToken(payload);

        // Update user with refresh token
        await this.usersService.updateUserToken(refresh_token, _id.toString());

        // Clear refresh token
        response.clearCookie('refresh_token');
        // set refresh_token as cookies
        response.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
        });

        return {
          access_token: this.jwtService.sign(payload),
          user: {
            _id,
            username,
            fullname,
          },
        };
      } else {
        throw new BadRequestException(
          'Refresh token không hợp lệ. Vui lòng login',
        );
      }
    } catch (error) {
      throw new BadRequestException(
        'Refresh token không hợp lệ. Vui lòng login',
      );
    }
  };
  logout = async (response: Response, user: IUser) => {
    await this.usersService.updateUserToken('', user._id);
    response.clearCookie('refresh_token');
    return 'ok';
  };
  changePassword = async (
    user: IUser,
    currentPassword: string,
    newPassword: string,
  ) => {
    const { username } = user;
    const account: any = await this.usersService.findOneByUsername(username);
    console.log('>>>check user: ', account);
    if (account) {
      const isValid = this.usersService.isValidPassword(
        currentPassword,
        account.password,
      );
      if (isValid === true) {
        let updateUser = await this.usersService.updatePassword(
          username,
          newPassword,
        );
        return updateUser;
      } else {
        throw new BadRequestException(`Nhập sai mật khẩu`);
      }
    }
    return null;
  };
}
