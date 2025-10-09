const express = require('express');
const Joi = require('joi');

const Student = require('../models/Student');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation
const studentSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  rollNumber: Joi.string().required(),
  className: Joi.string().required(),
  dob: Joi.date().optional()
});

// Admin adds student
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { error, value } = studentSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  try {
    if (await Student.findOne({ rollNumber: value.rollNumber })) return res.status(400).json({ message: 'rollNumber already exists' });
    const student = await Student.create(value);
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Create failed', error: err.message });
  }
});

// Get students (filter by className optional)
router.get('/', authMiddleware, async (req, res) => {
  const filter = {};
  if (req.query.className) filter.className = req.query.className;
  try {
    const students = await Student.find(filter).sort({ lastName: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single student (admin or the student themselves)
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: 'Not found' });
    // if requester is student role ensure it's their own record
    if (req.user.role === 'student') {
      if (!req.user.studentRef || req.user.studentRef.toString() !== id) return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin can update/delete student
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: 'Not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    // optional: also remove linked user
    await User.updateMany({ studentRef: req.params.id }, { $set: { studentRef: null } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
