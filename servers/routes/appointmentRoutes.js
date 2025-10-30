// servers/routes/appointRoutes.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment'); // Assuming the model is one level up from routes
const auth = require('../middleware/auth'); // Assuming an authentication middleware exists

// Helper middleware to ensure user is a patient (or just authenticated for now)
const isPatient = (req, res, next) => {
  // In a real application, you'd check the user's role here, e.g., req.user.role === 'patient'
  // For this context, we'll assume any authenticated user accessing this is a patient
  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
  }
  next();
};

/**
 * @route POST /api/appointments
 * @desc Book a new appointment
 * @access Private (Patient)
 * @usedBy ayush-app/src/pages/patient/BookAppointment.jsx
 */
router.post('/', auth, isPatient, async (req, res) => {
  try {
    // req.user is added by the 'auth' middleware and contains the logged-in user's info
    const patientId = req.user._id; 
    
    // Extract relevant data from request body (matching the fields in BookAppointment.jsx's formData)
    const {
      appointmentType,
      therapyType,
      preferredDate,
      preferredTime,
      alternateDate,
      alternateTime,
      symptoms,
      medicalHistory,
      currentMedications,
      allergies,
      priority,
    } = req.body;

    // Basic validation check (more robust validation should happen in frontend and backend)
    if (!appointmentType || !preferredDate || !preferredTime || !symptoms) {
      return res.status(400).json({ error: 'Missing required fields: appointmentType, preferredDate, preferredTime, symptoms' });
    }
    
    if (appointmentType === 'therapy' && !therapyType) {
        return res.status(400).json({ error: 'Therapy type is required for therapy appointments' });
    }

    const newAppointment = new Appointment({
      patientId,
      appointmentType,
      therapyType: appointmentType === 'therapy' ? therapyType : undefined, // Only save if type is 'therapy'
      preferredDate,
      preferredTime,
      alternateDate,
      alternateTime,
      symptoms,
      medicalHistory,
      currentMedications,
      allergies,
      priority: priority || 'normal',
      status: 'pending', // Default status from Appointment.js
    });

    const appointment = await newAppointment.save();

    res.status(201).json({ 
        message: 'Appointment request submitted successfully',
        appointment: appointment 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error during appointment booking');
  }
});

// ------------------------------------------------------------------

/**
 * @route GET /api/appointments
 * @desc Get all appointments for the logged-in patient
 * @access Private (Patient)
 * @usedBy ayush-app/src/pages/patient/PatientAppointments.jsx
 */
router.get('/', auth, isPatient, async (req, res) => {
  try {
    const patientId = req.user._id;

    // Fetch appointments for the patient, sorting by preferredDate
    const appointments = await Appointment.find({ patientId })
      .sort({ preferredDate: -1, preferredTime: -1 });

    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error fetching patient appointments');
  }
});

// ------------------------------------------------------------------

/**
 * @route PUT /api/appointments/:id/cancel
 * @desc Cancel a specific appointment
 * @access Private (Patient)
 * @usedBy ayush-app/src/pages/patient/PatientAppointments.jsx
 */
router.put('/:id/cancel', auth, isPatient, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const patientId = req.user._id;
    const { cancellationReason } = req.body;

    // Find the appointment and ensure it belongs to the logged-in patient
    let appointment = await Appointment.findOne({ _id: appointmentId, patientId });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or not authorized' });
    }

    // Use the custom method from Appointment.js to check if cancellation is allowed
    // Note: This relies on the canBeCancelled method correctly using preferredDate and preferredTime for calculation.
    // A simple status check is implemented here for robustness, assuming the frontend also validates.
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        return res.status(400).json({ error: 'Appointment cannot be cancelled as it is already completed or cancelled.' });
    }
    
    // Optional: Include the logic from the Mongoose schema method if possible, 
    // or rely on a time check on the server side before updating.
    // For now, we rely on the status check and client-side logic in PatientAppointments.jsx.

    // Update the appointment status and cancellation details
    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledBy = patientId;
    appointment.cancelledAt = new Date();

    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error during appointment cancellation');
  }
});

module.exports = router;