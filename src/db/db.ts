import mongoose, { Schema, model, models } from "mongoose";

const userSchema = new Schema({
  email: String,
  username: String,
  password_hash: String,
});

export const User = models?.User || model("User", userSchema);

const sessionSchema = new Schema({
  sessionId: String,
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  exppiresAt: Date,
  csrfToken: String,
});

export const Session = models?.Session || model("Session", sessionSchema);

export function mongooseConnect() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.asPromise();
  } else {
    const mongooseConnection = mongoose.connect("mongodb://localhost:4000");
    return mongooseConnection;
  }
}
