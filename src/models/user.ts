import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";

interface IUser {
  username: string;
  email: string;
  password: string;
}
interface IUserMethods {
  isCorrectPassword: (rawPassword: string) => Promise<Boolean>;
}

type UserDocument = Document & IUser & IUserMethods;

const userSchema = new mongoose.Schema<UserDocument>(
  {
    username: {
      type: String,
      trim: true,
      required: [true, "username is required"]
    },
    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minLength: [7, "password must be at least 7 characters long"],
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.isCorrectPassword = function (rawPassword: string) {
  return bcrypt.compare(rawPassword, this.password);
};

const UserModel = mongoose.model("user", userSchema);
export default UserModel;
