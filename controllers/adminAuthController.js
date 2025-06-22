import adminModel from "../models/adminModel.js";
import jwt from "jsonwebtoken";
import { encryptRefreshToken } from './../utils/encryptionAndOtp.js';
import roleModel from "../models/roleModel.js";
import permissionModel from "../models/permissionModel.js";

export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
      });
    }

    const existingAdmin = await adminModel.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }
    const existingRole = await roleModel.findById(role);
    if (!existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role does not exist",
      });
    }

    const newAdmin = await new adminModel({
      name,
      email,
      password,
      role: existingRole._id
    }).save();

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: {
          _id: existingRole._id,
          name: existingRole.name,
          permissions: existingRole.permissions.map(permission => ({
            _id: permission._id,
            name: permission.name
          }))
        }
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something Went Wrong. Please try again sometime later.",
    });
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const match = await admin.matchPassword(password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Email or Password is not correct",
      });
    }

    const accessToken = await admin.generateToken();
    let refreshToken = await admin.generateRefreshToken();
    console.log(refreshToken);

    admin.refreshToken = refreshToken;
    await admin.save();

    refreshToken = encryptRefreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
      },
      token: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something Went Wrong. Please try again sometime later.",
    });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, permissions, description } = req.body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "Name and permissions are required",
      });
    }

    const existingRole = await roleModel.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role already exists",
      });
    }
    const validPermissions = await permissionModel.find({
      _id: { $in: permissions }
    });

    if (validPermissions.length !== permissions.length) {
      return res.status(400).json({
        success: false,
        message: "Some permissions are invalid",
      });
    }

    const newRole = await new roleModel({
      name,
      permissions,
      description: description || "",
    }).save();

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      role: newRole,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something Went Wrong. Please try again sometime later.",
    });
  }
}
export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, permissions, description } = req.body;

    if (!roleId || !name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "Role ID, name and permissions are required",
      });
    }

    const existingRole = await roleModel.findById(roleId);
    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const validPermissions = await permissionModel.find({
      _id: { $in: permissions }
    });

    if (validPermissions.length !== permissions.length) {
      return res.status(400).json({
        success: false,
        message: "Some permissions are invalid",
      });
    }

    existingRole.name = name;
    existingRole.permissions = permissions;
    existingRole.description = description || "";
    
    await existingRole.save();

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      role: existingRole,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something Went Wrong. Please try again sometime later.",
    });
  }
}

export const createPermission = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const existingPermission = await permissionModel.findOne({ name });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: "Permission already exists",
      });
    }

    const newPermission = await new permissionModel({
      name,
      description: description || "",
    }).save();

    res.status(201).json({
      success: true,
      message: "Permission created successfully",
      permission: newPermission,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something Went Wrong. Please try again sometime later.",
    });
  }
}