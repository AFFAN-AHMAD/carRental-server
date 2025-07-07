import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database connected")
    );
    await mongoose.connect(`${process.env.MONGODB_URI}/car-rental`);
  } catch (err) {
    console.log(err);
  }
};

export default connectDB;
