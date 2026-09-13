import { User } from '../models/User.js';
import { broadcastRealtimeEvent } from '../services/realtimeService.js';

// 1. Super Admin: Get All Admins & Staff
export const getAllStaffAdmins = async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ['admin', 'superadmin'] },
      isDeleted: { $ne: true },
    })
      .select('-password')
      .sort({ role: -1, createdAt: -1 });

    res.status(200).json(staff);
  } catch (error) {
    console.error('Get Staff Error:', error);
    res.status(500).json({ message: 'Failed to fetch staff admins' });
  }
};

// 2. Super Admin: Add New Admin
export const addStaffAdmin = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      if (existing.role === 'admin' || existing.role === 'superadmin') {
        return res.status(400).json({ message: 'An admin with this email already exists' });
      }
      // Promote existing user to admin
      existing.role = 'admin';
      existing.name = name.trim();
      if (phone) existing.phone = phone.trim();
      if (password) existing.password = password;
      existing.isVerified = true;
      await existing.save();

      broadcastRealtimeEvent({ type: 'ADMIN_LIST_CHANGED' });

      return res.status(200).json({
        message: `Existing user ${existing.name} successfully promoted to Admin!`,
        admin: {
          _id: existing._id,
          name: existing.name,
          email: existing.email,
          phone: existing.phone,
          role: existing.role,
        },
      });
    }

    // Create new admin user
    const newAdmin = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      password,
      role: 'admin',
      isVerified: true,
    });

    broadcastRealtimeEvent({ type: 'ADMIN_LIST_CHANGED' });

    res.status(201).json({
      message: `Admin ${newAdmin.name} (${newAdmin.email}) created successfully!`,
      admin: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error('Add Admin Error:', error);
    res.status(500).json({ message: 'Failed to create admin: ' + error.message });
  }
};

// 3. Super Admin: Delete an Admin
export const deleteStaffAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const targetAdmin = await User.findById(id);
    if (!targetAdmin) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    // Protection: Super Admin can NEVER be deleted
    if (
      targetAdmin.role === 'superadmin' ||
      targetAdmin.email === 'ok8023361@gmail.com'
    ) {
      return res.status(403).json({
        message: 'Forbidden: The Super Admin account is protected and cannot be deleted!',
      });
    }

    // Protection: Cannot delete own account
    if (targetAdmin._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    const adminName = targetAdmin.name;
    const adminEmail = targetAdmin.email;

    // Permanently remove admin
    await User.findByIdAndDelete(targetAdmin._id);

    broadcastRealtimeEvent({ type: 'ADMIN_LIST_CHANGED' });

    res.status(200).json({
      message: `Admin ${adminName} (${adminEmail}) was successfully removed from admin staff.`,
    });
  } catch (error) {
    console.error('Delete Admin Error:', error);
    res.status(500).json({ message: 'Failed to delete admin: ' + error.message });
  }
};
