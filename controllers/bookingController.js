// function to check availability of car for a given date

import Booking from "../models/Booking.js";
import Car from "../models/Cars.js";

const checkAvailability = async (car, pickupDate, returnDate) => {
  const bookings = await Booking.find({
    car,
    pickupDate: {
      $lte: returnDate,
    },
    returnDate: {
      $gte: pickupDate,
    },
  });
  return bookings.length == 0;
};

// api to check the availability of cars for the given date
export const checkAvailabilityOfCar = async (req, res) => {
  try {
    const { location, pickupDate, returnDate } = req.body;
    // fetch all available cars
    const cars = await Car.find({
      location,
      isAvailable: true,
    });

    // check car availability for the given date

    const availableCarsPromises = cars.map(async (car) => {
      const isAvailable = await checkAvailability(
        car._id,
        pickupDate,
        returnDate
      );
      return { ...car._doc, isAvailable };
    });
    let availableCars = await Promise.all(availableCarsPromises);

    availableCars = availableCars.filter((car) => car.isAvailable == true);
    res.json({
      success: true,
      availableCars,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

// api to create booking
export const createBooking = async (req, res) => {
  try {
    const { _id } = req.user;
    const { car, pickupDate, returnDate } = req.body;

    const isAvailable = await checkAvailability(car, pickupDate, returnDate);

    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Car is not available",
      });
    }

    const carData = await Car.findById(car);

    // calculate price based on pickup date
    const picked = new Date(pickupDate);
    const returned = new Date(returnDate);
    const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24));
    const price = carData.pricePerDay * noOfDays;

    await Booking.create({
      car,
      owner: carData.owner,
      user: _id,
      pickupDate,
      returnDate,
      price,
    });
    res.json({
      success: true,
      message: "booking created",
    });
  } catch (err) {
    console.log(err);
  }
};

// api to list user bookings
export const getUserBookings = async (req, res) => {
  try {
    const { _id } = req.user;
    const bookings = await Booking.find({
      user: _id,
    })
      .populate("car")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

// api to list user bookings
export const getOwnerBookings = async (req, res) => {
  try {
    if (req.user.role != "owner") {
      console.log("req", req);
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }
    const bookings = await Booking.find({
      owner: req.user._id,
    })
      .populate("car user")
      .select("-user.password")
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      bookings,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

// API to change booking
export const changeBookingStatus = async (req, res) => {
  try {
    const { _id } = req.user;
    const { bookingId, status } = req.body;
    const booking = await Booking.findById(bookingId);
    if (booking.owner.toString() != _id.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }
    booking.status = status;
    await booking.save();
    res.json({
      success: true,
      message: "status updated",
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};
