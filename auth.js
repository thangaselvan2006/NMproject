const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const User = require('../models/User');
const Student = require('../models/Student');

const router = express.Router();

const registerSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin','student').required(),
  studentRoll: Joi.string().optional() // when role=student, optionally provide student roll to link
});

router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { username, password, role, studentRoll } = value;
  try {
    if (await User.findOne({ username })) return res.status(400).json({ message: 'Username taken' });
    const passwordHash = await bcrypt.hash(password, 12);
    let studentRef = null;
    if (role === 'student' && studentRoll) {
      const student = await Student.findOne({ rollNumber: studentRoll });
      if (!student) return res.status(400).json({ message: 'No student found with that rollNumber to link' });
      studentRef = student._id;
    }
    const user = await User.create({ username, passwordHash, role, studentRef });
    res.json({ id: user._id, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { username, password } = value;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRES_IN || '8h' });
    res.json({ token, role: user.role, id: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

module.exports = router;
