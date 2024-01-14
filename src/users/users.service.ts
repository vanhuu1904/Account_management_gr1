import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User as UserM, UserDocument } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { IUser } from './users.interface';
import { User } from 'src/decorator/customize';
import aqp from 'api-query-params';
import ms from 'ms';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { response } from 'express';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserM.name)
    private userModel: SoftDeleteModel<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  getHashPassword = (password: string) => {
    var salt = genSaltSync(10);
    var hash = hashSync(password, salt);
    return hash;
  };
  async create(createUserDto: CreateUserDto, @User() user: IUser) {
    const { username, password, fullname, studentcode, address } =
      createUserDto;
    const isExist = await this.userModel.findOne({ username });
    if (isExist) {
      throw new BadRequestException(
        `Username: ${username} đã tồn tại. Vui lòng sử dụng username khác`,
      );
    }
    const hashPassword = this.getHashPassword(password);
    let newUser = await this.userModel.create({
      username,
      password: hashPassword,
      fullname,
      studentcode,
      address,
      createBy: {
        _id: user._id,
        username: user.username,
      },
    });
    return newUser;
  }
  async bulk_create(data, @User() user: IUser) {
    let res = data.map(async (index, item: any) => {
      const isExist = await this.userModel.findOne({ username: item.username });
      if (isExist) {
        throw new BadRequestException(
          `Username: ${item.username} đã tồn tại. Vui lòng sử dụng username khác`,
        );
      }
      const hashPassword = this.getHashPassword(item.password);
      let newUser = await this.userModel.create({
        username: item.username,
        password: hashPassword,
        fullname: item.fullname,
        studentcode: item.studentcode,
        address: item.address,
        createBy: {
          _id: user._id,
          username: user.username,
        },
      });
    });
    return res;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .select('-password')
      .populate(population)
      .exec();
    return {
      meta: {
        current: currentPage, //trang hiện tại
        pageSize: limit, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang
        total: totalItems, //tổng số bản ghi
      },
      result,
    };
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'not found user';
    }
    let user = await this.userModel.findOne({ _id: id }).select('-password'); //Không lấy ra password
    return user;
  }

  async update(updateUserDto: UpdateUserDto, @User() user: IUser) {
    return await this.userModel.updateOne(
      { _id: updateUserDto._id },
      {
        ...updateUserDto,
        updatedBy: {
          _id: user._id,
          username: user.username,
        },
      },
    );
  }

  async remove(id: string, @User() user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'not found user';
    }
    await this.userModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          username: user.username,
        },
      },
    );
    return this.userModel.softDelete({ _id: id });
  }

  async register(user: RegisterUserDto) {
    const { username, password, fullname, studentcode, address } = user;
    const isExist = await this.userModel.findOne({ username });
    if (isExist) {
      throw new BadRequestException(
        `username ${username} đã tồn tại. Vui lòng sử dụng username khác`,
      );
    }

    const hashPassword = this.getHashPassword(password);
    let newRegister = await this.userModel.create({
      username,
      password: hashPassword,
      fullname,
      studentcode,
      address,
    });
    return newRegister;
  }

  findOneByUsername(username: string) {
    return this.userModel.findOne({ username });
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  updateUserToken = async (refreshToken: string, _id: string) => {
    return await this.userModel.updateOne(
      {
        _id,
      },
      {
        refreshToken,
      },
    );
  };
  updateUserTokenWithGoogle = async (refreshToken: string, email: string) => {
    return await this.userModel.updateOne(
      {
        username: email,
      },
      {
        refreshToken,
      },
    );
  };

  findUserByToken = async (refreshToken: string) => {
    return await this.userModel.findOne({ refreshToken });
  };

  updatePassword = async (username: string, newPassword: string) => {
    const hashNewPassword = this.getHashPassword(newPassword);
    return await this.userModel.updateOne(
      { username },
      { password: hashNewPassword },
    );
  };
  createRefreshToken = (payload: any) => {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')) / 1000,
    });
    return refresh_token;
  };
  createANewUser = async (username: string, name: string, type: string) => {
    let newUser = await this.userModel.create({
      username,
      fullname: name,
      type: type,
    });
    return newUser;
  };
  upsertUserGoogle = async (typeAcc, dataRaw) => {
    try {
      let user = null;
      user = await this.userModel.findOne({
        username: dataRaw.username,
      });
      if (!user || user.type == 'FACEBOOK') {
        // create a new account
        user = await this.userModel.create({
          username: dataRaw.username,
          fullname: dataRaw.fullname,
          type: typeAcc,
        });
        return user;
      } else {
        return user;
      }
    } catch (error) {
      console.log(error);
    }
  };
  upsertUserFacebook = async (typeAcc, dataRaw) => {
    try {
      let user = null;
      user = await this.userModel.findOne({
        username: dataRaw.username,
      });
      if (!user || user.type == 'GOOGLE') {
        // create a new account
        user = await this.userModel.create({
          username: dataRaw.username,
          fullname: dataRaw.fullname,
          type: typeAcc,
        });
        return user;
      } else {
        return user;
      }
    } catch (error) {
      console.log(error);
    }
  };
}
