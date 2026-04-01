
// login and register 
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 


router.post('/register', async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        let userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                error: { code: "BAD_REQUEST", message: "Email already registered" }
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

       
        const newUser = new User({
            name: displayName || username || "User", 
            email,
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        const token = jwt.sign(
            { id: savedUser._id }, 
            process.env.JWT_SECRET || "stackai_secret", 
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            data: {
                userId: savedUser._id,
                username: savedUser.name, 
                email: savedUser.email,
                accessToken: token
            }
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: { code: "SERVER_ERROR", message: err.message } 
        });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body; 

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: { code: "INVALID_TOKEN", message: "Invalid email " }
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: { code: "INVALID_TOKEN", message: "Invalid password" }
            });
        }

        const accessToken = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET || "stackai_secret", 
            { expiresIn: '24h' }
        );

        
        res.status(200).json({
            success: true,
            data: {
                accessToken: accessToken,
                userId: user._id,   
                username: user.name, 
                expiresIn: 86400 
            }
        });
        

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: { code: "SERVER_ERROR", message: err.message } 
        });
    }
});

module.exports = router;