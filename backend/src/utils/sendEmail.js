import nodemailer from 'nodemailer';
import { asyncHandler } from './asyncHandler.js';

export const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASSWORD
    }
});

export const sendEmail = asyncHandler(async(to,subject,text)=>{
    await transporter.sendMail({
        from:`"Complaint System"<${process.env.EMAIL_USER}>`,
        to,
        subject,
        text
    });
});