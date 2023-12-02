import { IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({
    message: 'username khÔng được để trống',
  })
  username: string;
  @IsNotEmpty({
    message: 'password khÔng được để trống',
  })
  password: string;

  fullname: string;
  studentcode: number;
  address: string;
}
export class RegisterUserDto {
  @IsNotEmpty({
    message: 'username khÔng được để trống',
  })
  username: string;
  @IsNotEmpty({
    message: 'password khÔng được để trống',
  })
  password: string;

  fullname: string;
  studentcode: number;
  address: string;
}
