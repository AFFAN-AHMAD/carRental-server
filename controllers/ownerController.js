import imagekit from "../configs/imageKit.js";
import Booking from "../models/Booking.js";
import Car from "../models/Cars.js";
import User from "../models/User.js";
import fs from "fs";

export const changeRoleToOwner = async (req, res) => {
  try {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { role: "owner" });
    return res.json({
      success: true,
      message: "Now you can list cars",
    });
  } catch (err) {
    console.log(err);
    return res.json({
      success: false,
      message: err.message,
    });
  }
};

// API to list car

export const addCar = async (req, res) => {
  try {
    const { _id } = req.user;
    let car = JSON.parse(req.body.carData);
    console.log("req.file", req.body);
    console.log("req.file", req.file);
    const imageFile = req.file;
    const fileBuffer = fs.readFileSync(imageFile.path);
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/cars",
    });
    // console.log("response", response);
    // For URL Generation, works for both images and videos
    var optimizedImageURL = imagekit.url({
      path: response.filePath,
      // urlEndpoint: response.url,
      transformation: [
        {
          width: "1280",
        },
        // auto compression
        {
          quality: "auto",
        },
        // convert to odern format
        {
          format: "webp",
        },
      ],
    });
    const image = optimizedImageURL;
    // console.log("image", image);
    await Car.create({
      ...car,
      owner: _id,
      image,
    });

    return res.json({
      success: true,
      message: "Car Added",
    });
  } catch (err) {
    console.log("ERROR", err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

// API to list owner cars
export const getOwnerCars = async (req, res) => {
  try {
    const { _id } = req.user;
    const cars = await Car.find({
      owner: _id,
    });

    res.json({
      success: true,
      cars,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

// API to toggle car availability

export const toggleCarAvailability = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    // checking is car belongs to user
    if (car.owner.toString() !== _id.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }
    car.isAvailable = !car.isAvailable;

    await car.save();

    res.json({
      success: true,
      message: "Availablility toggled",
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

// for deleting car

export const deleteCar = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    // checking is car belongs to user
    if (car.owner.toString() !== _id.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }
    car.owner = null;
    car.isAvailable = false;
    await car.save();

    res.json({
      success: true,
      message: "car removed",
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

// api to get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const { _id, role } = req.user;
    if (role != "owner") {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }
    const cars = await Car.find({ owner: _id });
    const bookings = await Booking.find({
      owner: _id,
    })
      .populate("car")
      .sort({ createdAt: -1 });

    const pendingBookings = await Booking.find({
      owner: _id,
      status: "pending",
    });
    const completedBookings = await Booking.find({
      owner: _id,
      status: "confirmed",
    });

    // calculate monthly revenue
    const monthlyRevenue = bookings
      .slice()
      .filter((booking) => booking.status == "confirmed")
      .reduce((acc, booking) => acc + booking.price, 0);

    const dashboardData = {
      totalCars: cars.length,
      totalBookings: bookings.length,
      completedBookings: completedBookings.length,
      pendingBookings: pendingBookings.length,
      recentBookings: bookings.slice(0, 3),
      monthlyRevenue,
    };
    return res.json({
      success: true,
      dashboardData,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

// API to update userImage

export const updateUserImage = async (req, res) => {
  try {
    const { _id } = req.user;
    const imageFile = req.file;
    console.log("imageFile", imageFile);
    console.log("req.file", req.file);
    const fileBuffer = fs.readFileSync(imageFile.path);
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/users",
    });
    // console.log("response", response);
    // For URL Generation, works for both images and videos
    var optimizedImageURL = imagekit.url({
      path: response.filePath,
      // urlEndpoint: response.url,
      transformation: [
        {
          width: "400",
        },
        // auto compression
        {
          quality: "auto",
        },
        // convert to odern format
        {
          format: "webp",
        },
      ],
    });
    const image = optimizedImageURL;
    // console.log("image", image);
    await User.findByIdAndUpdate(_id, { image });

    res.json({
      success: true,
      message: "Image Updated",
    });
  } catch (err) {
    console.log(err);
  }
};
