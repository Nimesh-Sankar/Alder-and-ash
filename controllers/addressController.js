import mongoose from "mongoose";
import Address from "../models/addressModel.js";

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Add new address
export const addAddress = async (req, res) => {
  try {
    const { 
      userId, 
      label, 
      fullName, 
      phone, 
      line1, 
      line2, 
      street, 
      city, 
      state, 
      pincode, 
      country, 
      isDefault 
    } = req.body;
    
    // Validate userId
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing userId. Please provide a valid MongoDB ObjectId"
      });
    }
    
    
    if (isDefault) {
      await Address.updateMany(
        { userId },
        { isDefault: false }
      );
    }
    
    
    const addressCount = await Address.countDocuments({ userId });
    const shouldBeDefault = addressCount === 0 ? true : isDefault || false;
    
    const address = new Address({
      userId: new mongoose.Types.ObjectId(userId),
      label: label || "Home",
      fullName,
      phone,
      line1,
      line2: line2 || "",
      street,
      city,
      state,
      pincode,
      country: country || "India",
      isDefault: shouldBeDefault,
    });
    
    await address.save();
    
    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    console.log("ADD ADDRESS ERROR:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

// Update address
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    
    if (!isValidObjectId(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID format"
      });
    }
    
    const { 
      label, 
      fullName, 
      phone, 
      line1, 
      line2, 
      street, 
      city, 
      state, 
      pincode, 
      country, 
      isDefault 
    } = req.body;
    
    
    const currentAddress = await Address.findById(addressId);
    
    if (!currentAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }
    
    
    if (isDefault) {
      await Address.updateMany(
        { userId: currentAddress.userId },
        { isDefault: false }
      );
    }
    
    const address = await Address.findByIdAndUpdate(
      addressId,
      {
        label: label || currentAddress.label,
        fullName,
        phone,
        line1,
        line2: line2 || "",
        street,
        city,
        state,
        pincode,
        country: country || "India",
        isDefault: isDefault !== undefined ? isDefault : currentAddress.isDefault,
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    );
    res.json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.log("UPDATE ADDRESS ERROR:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

// Delete address
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    
    if (!isValidObjectId(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID format"
      });
    }
    
    const address = await Address.findById(addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }
    
    
    const wasDefault = address.isDefault;
    const userId = address.userId;
    
    await Address.findByIdAndDelete(addressId);
    
    
    if (wasDefault) {
      const nextAddress = await Address.findOne({ userId })
        .sort({ createdAt: 1 });
      
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }
    
    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.log("DELETE ADDRESS ERROR:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

export const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }

    const addresses = await Address.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      addresses
    });

  } catch (error) {
    console.log("GET ADDRESSES ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};