const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  className: { type: String, required: true }, // e.g., "10A", "12B"
  dob: { type: Date },
  // optional: other profile fields
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
