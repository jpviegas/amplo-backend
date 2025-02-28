import { mongooseConnect, User } from "./db";

export async function createUser(userData) {
  try {
    await mongooseConnect();
    const user = await User.create({ userData });
    return user;
  } catch (error) {
    return false;
  }
}

export async function getUserByEmail(email) {
  try {
    await mongooseConnect();
    const user = await User.findOne({ email: email }).exec();
    return user;
  } catch (error) {
    return false;
  }
}

export async function getUserByUsername(username) {}
