const express = require('express');
const Joi = require('joi');

const Grade = require('../models/Grade');
const Student = require('../models/Student');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

const gradeSchema = Joi.object({
  studentId: Joi.string().required(),
  subject: Joi.string().required(),
  marks: Joi.number().min(0).required(),
  totalMarks: Joi.number().min(1).optional(),
  gradeType: Joi.string().valid('exam','assignment','quiz','project','other').optional(),
  remarks: Joi.string().optional()
});

// Admin adds grade
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { error, value } = gradeSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    const student = await Student.findById(value.studentId);
    if (!student) return res.status(400).json({ message: 'Student not found' });
    const grade = await Grade.create({
      student: student._id,
      subject: value.subject,
      marks: value.marks,
      totalMarks: value.totalMarks || 100,
      gradeType: value.gradeType || 'exam',
      remarks: value.remarks
    });
    res.json(grade);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get grades for a student (admin or the student themselves)
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  const { studentId } = req.params;
  try {
    if (req.user.role === 'student') {
      // student can only access own records
      if (!req.user.studentRef || req.user.studentRef.toString() !== studentId) return res.status(403).json({ message: 'Forbidden' });
    }
    const grades = await Grade.find({ student: studentId }).populate('student', 'firstName lastName rollNumber className');
    res.json(grades);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get grades for a class (admin only) with optional subject filter
router.get('/class/:className', authMiddleware, requireRole('admin'), async (req, res) => {
  const { className } = req.params;
  const subjectFilter = req.query.subject;
  try {
    const students = await Student.find({ className }, '_id');
    const studentIds = students.map(s => s._id);
    const q = { student: { $in: studentIds } };
    if (subjectFilter) q.subject = subjectFilter;
    const grades = await Grade.find(q).populate('student', 'firstName lastName rollNumber className');
    res.json(grades);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Optional: update and delete grade (admin)
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!grade) return res.status(404).json({ message: 'Not found' });
    res.json(grade);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await Grade.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
