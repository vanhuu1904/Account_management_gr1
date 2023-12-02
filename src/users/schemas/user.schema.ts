import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty } from 'class-validator';
import mongoose, { HydratedDocument } from 'mongoose';
// import { IsNotEmpty } from 'class-validator';
export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @IsNotEmpty()
  @Prop({ required: true })
  username: string;
  @IsNotEmpty()
  @Prop({ required: true })
  password: string;
  @IsNotEmpty()
  @Prop()
  fullname: string;
  @IsNotEmpty()
  @Prop()
  studentcode: number;
  @IsNotEmpty()
  @Prop()
  address: string;
  @Prop()
  refreshToken: string;
  @Prop()
  createdAt: Date;

  @Prop({ type: Object })
  createdBy: {
    _id: mongoose.Schema.Types.ObjectId;
    username: string;
  };
  @Prop()
  updatedAt: Date;
  @Prop({ type: Object })
  updatedBy: {
    _id: mongoose.Schema.Types.ObjectId;
    username: string;
  };
  @Prop()
  isDeleted: boolean;
  @Prop({ type: Object })
  deletedBy: {
    _id: mongoose.Schema.Types.ObjectId;
    username: string;
  };
  @Prop()
  deletedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
