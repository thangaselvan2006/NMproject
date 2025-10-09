const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  marks: { type: Number, required: true, min: 0 },
  totalMarks: { type: Number, default: 100 },
  gradeType: { type: String, enum: ['exam','assignment','quiz','project','other'], default: 'exam' },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Grade', gradeSchema);
