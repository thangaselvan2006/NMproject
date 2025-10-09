const express = require('express');
const PDFDocument = require('pdfkit');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Export a single student's report card as PDF
// Access: admin or that student
router.get('/reportcard/:studentId', authMiddleware, async (req, res) => {
  const { studentId } = req.params;
  // role check: admin or the student themself
  if (req.user.role === 'student') {
    if (!req.user.studentRef || req.user.studentRef.toString() !== studentId) return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const grades = await Grade.find({ student: student._id });

    // Create PDF
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-disposition', `attachment; filename=reportcard_${student.rollNumber}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Report Card', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${student.firstName} ${student.lastName}`);
    doc.text(`Roll Number: ${student.rollNumber}`);
    doc.text(`Class: ${student.className}`);
    if (student.dob) doc.text(`DOB: ${student.dob.toISOString().split('T')[0]}`);
    doc.moveDown();

    // Grades table-like output
    doc.fontSize(14).text('Grades', { underline: true });
    doc.moveDown(0.5);

    if (grades.length === 0) {
      doc.text('No grades recorded.');
    } else {
      // header row
      doc.fontSize(11).text('Subject', { continued: true, width: 200 });
      doc.text('Marks', { continued: true, align: 'center', width: 80 });
      doc.text('Total', { continued: true, align: 'center', width: 80 });
      doc.text('Type', { align: 'right' });
      doc.moveDown(0.5);

      grades.forEach(g => {
        doc.fontSize(11).text(g.subject, { continued: true, width: 200 });
        doc.text(String(g.marks), { continued: true, align: 'center', width: 80 });
        doc.text(String(g.totalMarks || 100), { continued: true, align: 'center', width: 80 });
        doc.text(g.gradeType || 'exam', { align: 'right' });
      });

      // Simple GPA/average calculation
      const totalObtained = grades.reduce((s,g) => s + g.marks, 0);
      const totalMax = grades.reduce((s,g) => s + (g.totalMarks || 100), 0);
      const percentage = totalMax ? (totalObtained / totalMax) * 100 : 0;
      doc.moveDown();
      doc.fontSize(12).text(`Total: ${totalObtained} / ${totalMax}`);
      doc.text(`Percentage: ${percentage.toFixed(2)}%`);
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
