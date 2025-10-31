// servers/routes/appointmentRoutes.js - FIXED WITH DASHBOARD NOTIFICATIONS
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');
const auth = require('../middleware/auth');

// ✅ Apply auth to all routes
router.use(auth);

// =====================
// GET available doctors and therapists (for booking form)
// =====================
router.get('/providers', async (req, res) => {
  try {
    const { type } = req.query;
    
    const filter = { active: true };
    if (type) {
      filter.role = type;
    } else {
      filter.role = { $in: ['doctor', 'therapist'] };
    }
    
    const providers = await User.find(filter)
      .select('name email role phone')
      .sort({ name: 1 });
    
    res.json(providers);
  } catch (err) {
    console.error('❌ Fetch providers error:', err);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// =====================
// POST - Book appointment (Patient)
// =====================
router.post('/', async (req, res) => {
  try {
    const patientId = req.user._id;
    
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
      doctorId,
      therapistId
    } = req.body;

    // Validation
    if (!appointmentType || !preferredDate || !preferredTime || !symptoms) {
      return res.status(400).json({ 
        error: 'Missing required fields: appointmentType, preferredDate, preferredTime, symptoms' 
      });
    }
    
    if (appointmentType === 'therapy' && !therapyType) {
      return res.status(400).json({ error: 'Therapy type is required for therapy appointments' });
    }

    if (!doctorId && !therapistId) {
      return res.status(400).json({ error: 'Please select a doctor or therapist' });
    }

    // Verify provider exists
    const providerId = doctorId || therapistId;
    const providerRole = doctorId ? 'doctor' : 'therapist';
    
    const provider = await User.findOne({ 
      _id: providerId, 
      role: providerRole,
      active: true 
    });
    
    if (!provider) {
      return res.status(404).json({ error: `${providerRole} not found or inactive` });
    }

    const newAppointment = new Appointment({
      patientId,
      doctorId: doctorId || undefined,
      therapistId: therapistId || undefined,
      appointmentType,
      therapyType: appointmentType === 'therapy' ? therapyType : undefined,
      preferredDate,
      preferredTime,
      alternateDate,
      alternateTime,
      symptoms,
      medicalHistory,
      currentMedications,
      allergies,
      priority: priority || 'normal',
      status: 'pending',
    });

    const appointment = await newAppointment.save();
    
    // Populate before returning
    await appointment.populate('patientId', 'name email phone');
    await appointment.populate('doctorId', 'name email');
    await appointment.populate('therapistId', 'name email');

    console.log('✅ Appointment booked:', appointment._id);

    // ✅ FIXED: Create dashboard notification for admin AND provider
    try {
      const patient = await User.findById(patientId);
      
      // Get all admins
      const admins = await User.find({ role: 'admin', active: true });
      
      // Create notifications for each admin
      for (const admin of admins) {
        const adminNotification = new Notification({
          userId: admin._id,
          type: 'appointment-reminder',
          title: `New Appointment Request`,
          message: `${patient.name} has requested a ${appointmentType} appointment for ${new Date(preferredDate).toLocaleDateString()} at ${preferredTime}`,
          channel: 'in-app',
          scheduledFor: new Date(),
          status: 'sent',
          sentAt: new Date(),
          metadata: {
            appointmentId: appointment._id,
            patientName: patient.name,
            appointmentType: appointmentType,
            therapyType: therapyType,
            preferredDate: new Date(preferredDate).toLocaleDateString(),
            preferredTime: preferredTime
          }
        });
        await adminNotification.save();
        console.log(`✅ Dashboard notification created for admin: ${admin.email}`);
      }
      
      // Create notification for provider
      const providerNotification = new Notification({
        userId: provider._id,
        type: 'appointment-reminder',
        title: `New Appointment Assignment`,
        message: `You have been assigned a new ${appointmentType} appointment with ${patient.name}`,
        channel: 'in-app',
        scheduledFor: new Date(),
        status: 'sent',
        sentAt: new Date(),
        metadata: {
          appointmentId: appointment._id,
          patientName: patient.name,
          appointmentType: appointmentType,
          therapyType: therapyType,
          preferredDate: new Date(preferredDate).toLocaleDateString(),
          preferredTime: preferredTime
        }
      });
      await providerNotification.save();
      console.log(`✅ Dashboard notification created for provider: ${provider.email}`);
      
    } catch (notifErr) {
      console.warn('⚠️ Dashboard notification creation failed:', notifErr.message);
    }

    // Send email notification to provider
    if (provider.email) {
      setImmediate(async () => {
        try {
          const patient = await User.findById(patientId);
          await sendEmail(provider.email, 'appointment-assignment', {
            staffName: provider.name,
            patientName: patient.name,
            appointmentType: appointmentType,
            appointmentDate: new Date(preferredDate).toLocaleDateString(),
            appointmentTime: preferredTime
          });
          console.log('✅ Email sent to provider');
        } catch (emailErr) {
          console.warn('⚠️ Email notification failed:', emailErr.message);
        }
      });
    }

    res.status(201).json({ 
      message: 'Appointment request submitted successfully',
      appointment: appointment 
    });
  } catch (err) {
    console.error('❌ Book appointment error:', err);
    res.status(500).json({ error: 'Failed to book appointment', message: err.message });
  }
});

// =====================
// GET - Appointments (Role-based filtering)
// =====================
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    } else if (req.user.role === 'therapist') {
      query.therapistId = req.user._id;
    }
    // ✅ Admin sees ALL appointments (no filter)

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email')
      .populate('therapistId', 'name email')
      .populate('roomId', 'name location')
      .sort({ createdAt: -1, preferredDate: -1 });

    console.log(`✅ Fetched ${appointments.length} appointments for ${req.user.role}`);
    res.json(appointments);
  } catch (err) {
    console.error('❌ Fetch appointments error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// =====================
// PUT - Approve appointment (Doctor/Therapist/Admin)
// =====================
router.put('/:id/approve', async (req, res) => {
  try {
    const { confirmedDate, confirmedTime, roomId, staffNotes } = req.body;
    
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .populate('therapistId', 'name email');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // ✅ FIXED: Allow admin, doctor, or therapist to approve
    const canApprove = 
      req.user.role === 'admin' ||
      (req.user.role === 'doctor' && appointment.doctorId?._id.toString() === req.user._id.toString()) ||
      (req.user.role === 'therapist' && appointment.therapistId?._id.toString() === req.user._id.toString());
    
    if (!canApprove) {
      return res.status(403).json({ error: 'You do not have permission to approve this appointment' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ error: 'Appointment is not pending' });
    }

    // Update appointment
    appointment.status = 'approved';
    appointment.confirmedDate = confirmedDate || appointment.preferredDate;
    appointment.confirmedTime = confirmedTime || appointment.preferredTime;
    appointment.roomId = roomId;
    appointment.staffNotes = staffNotes;
    appointment.approvedBy = req.user._id;
    appointment.approvalDate = new Date();

    await appointment.save();
    
    await appointment.populate('roomId', 'name location');

    console.log('✅ Appointment approved:', appointment._id);

    // ✅ Create dashboard notification for patient
    try {
      const patientNotification = new Notification({
        userId: appointment.patientId._id,
        type: 'appointment-reminder',
        title: `Appointment Approved!`,
        message: `Your ${appointment.appointmentType} appointment has been confirmed for ${new Date(appointment.confirmedDate).toLocaleDateString()} at ${appointment.confirmedTime}`,
        channel: 'in-app',
        scheduledFor: new Date(),
        status: 'sent',
        sentAt: new Date(),
        metadata: {
          appointmentId: appointment._id,
          appointmentType: appointment.appointmentType,
          therapyType: appointment.therapyType,
          confirmedDate: new Date(appointment.confirmedDate).toLocaleDateString(),
          confirmedTime: appointment.confirmedTime,
          providerName: appointment.doctorId?.name || appointment.therapistId?.name
        }
      });
      await patientNotification.save();
      console.log('✅ Dashboard notification created for patient');
    } catch (notifErr) {
      console.warn('⚠️ Dashboard notification failed:', notifErr.message);
    }

    // Send confirmation email to patient
    if (appointment.patientId.email) {
      setImmediate(async () => {
        try {
          await sendEmail(appointment.patientId.email, 'appointment-approved', {
            patientName: appointment.patientId.name,
            appointmentDate: new Date(appointment.confirmedDate).toLocaleDateString(),
            appointmentTime: appointment.confirmedTime,
            therapyType: appointment.therapyType || appointment.appointmentType,
            location: 'Ayush Wellness Center'
          });
          console.log('✅ Confirmation email sent to patient');
        } catch (emailErr) {
          console.warn('⚠️ Email failed:', emailErr.message);
        }
      });
    }

    res.json({ message: 'Appointment approved successfully', appointment });
  } catch (err) {
    console.error('❌ Approve appointment error:', err);
    res.status(500).json({ error: 'Failed to approve appointment' });
  }
});

// =====================
// PUT - Reject appointment (Doctor/Therapist/Admin)
// =====================
router.put('/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // ✅ Allow admin, doctor, or therapist to reject
    const canReject = 
      req.user.role === 'admin' ||
      (req.user.role === 'doctor' && appointment.doctorId?.toString() === req.user._id.toString()) ||
      (req.user.role === 'therapist' && appointment.therapistId?.toString() === req.user._id.toString());
    
    if (!canReject) {
      return res.status(403).json({ error: 'You do not have permission to reject this appointment' });
    }

    appointment.status = 'rejected';
    appointment.rejectionReason = rejectionReason;
    appointment.approvedBy = req.user._id;
    appointment.approvalDate = new Date();

    await appointment.save();

    console.log('✅ Appointment rejected:', appointment._id);

    // ✅ Create dashboard notification for patient
    try {
      const patientNotification = new Notification({
        userId: appointment.patientId._id,
        type: 'appointment-reminder',
        title: `Appointment Request Update`,
        message: `Your appointment request has been declined. Reason: ${rejectionReason}`,
        channel: 'in-app',
        scheduledFor: new Date(),
        status: 'sent',
        sentAt: new Date(),
        metadata: {
          appointmentId: appointment._id,
          rejectionReason: rejectionReason
        }
      });
      await patientNotification.save();
      console.log('✅ Dashboard notification created for patient');
    } catch (notifErr) {
      console.warn('⚠️ Dashboard notification failed:', notifErr.message);
    }

    // Send rejection email to patient
    if (appointment.patientId.email) {
      setImmediate(async () => {
        try {
          await sendEmail(appointment.patientId.email, 'appointment-rejected', {
            patientName: appointment.patientId.name,
            appointmentDate: new Date(appointment.preferredDate).toLocaleDateString(),
            rejectionReason: rejectionReason
          });
          console.log('✅ Rejection email sent to patient');
        } catch (emailErr) {
          console.warn('⚠️ Email failed:', emailErr.message);
        }
      });
    }

    res.json({ message: 'Appointment rejected', appointment });
  } catch (err) {
    console.error('❌ Reject appointment error:', err);
    res.status(500).json({ error: 'Failed to reject appointment' });
  }
});

// =====================
// PUT - Cancel appointment (Patient)
// =====================
router.put('/:id/cancel', async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    
    const appointment = await Appointment.findOne({ 
      _id: req.params.id, 
      patientId: req.user._id 
    }).populate('doctorId therapistId', 'name email');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or not authorized' });
    }

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ 
        error: 'Appointment cannot be cancelled as it is already completed or cancelled.' 
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledBy = req.user._id;
    appointment.cancelledAt = new Date();

    await appointment.save();

    console.log('✅ Appointment cancelled:', appointment._id);

    // Notify provider
    const provider = appointment.doctorId || appointment.therapistId;
    if (provider && provider.email) {
      setImmediate(async () => {
        try {
          const patient = await User.findById(req.user._id);
          await sendEmail(provider.email, 'appointment-cancelled', {
            patientName: patient.name,
            appointmentDate: new Date(appointment.preferredDate).toLocaleDateString(),
            cancellationReason: cancellationReason || 'No reason provided'
          });
        } catch (emailErr) {
          console.warn('⚠️ Email failed:', emailErr.message);
        }
      });
    }

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (err) {
    console.error('❌ Cancel appointment error:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// =====================
// GET - Single appointment details
// =====================
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email')
      .populate('therapistId', 'name email')
      .populate('roomId', 'name location');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check access permissions
    const hasAccess = 
      req.user.role === 'admin' ||
      appointment.patientId._id.toString() === req.user._id.toString() ||
      (appointment.doctorId && appointment.doctorId._id.toString() === req.user._id.toString()) ||
      (appointment.therapistId && appointment.therapistId._id.toString() === req.user._id.toString());
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(appointment);
  } catch (err) {
    console.error('❌ Fetch appointment error:', err);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

module.exports = router;