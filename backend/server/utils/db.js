const mongoose = require('mongoose');
const URI = process.env.MONGODB_URI;


const connectDB = async () => {
  try {
    await mongoose.connect(URI);
     
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connectionfailed');
    process.exit(1);
  }                 
};
module.exports = connectDB;






