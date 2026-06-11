// // import nodemailer from 'nodemailer';

// // export const transporter = nodemailer.createTransport({
// //     service:"gmail",
// //     auth:{
// //         user:process.env.EMAIL_USER,
// //         pass:process.env.EMAIL_PASSWORD
// //     }
// // });

// // export const sendEmail = async(to,subject,text)=>{
// //     await transporter.sendMail({
// //         from:`"Complaint System"<${process.env.EMAIL_USER}>`,
// //         to,
// //         subject,
// //         text
// //     });
// // };

// import nodemailer from 'nodemailer';

// export const transporter = nodemailer.createTransport({
//     service:"gmail",
//     auth:{
//         user:'anjalikashi08@gmail.com',
//         pass:'abcd efgh ijkl mnop'
//     }
// });

// export const sendEmail = async()=>{
//     try{
//     await transporter.sendMail({
//         from:'anjalikashi08@gmail.com',
//         to:'anjalibindu2421@gmail.com',
//         subject:'Test Mail',
//         text:"Testing the possibility of mail"
//     });
//     console.log("Email sent:", info.response);
// }catch(error){
//     console.log("Error:", error);
// }
    
// };

// //to,subject,text

import dotenv from "dotenv";
dotenv.config();

import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (
  to,
  subject,
  text,
  html = null
) => {
  try {
    const msg = {
      to,
      from: process.env.SENDER_EMAIL,
      subject,
      text,
      html
    };

    const response = await sgMail.send(msg);

    console.log("Email sent successfully");
    console.log(response[0].statusCode);
  } catch (error) {
    console.log("SendGrid Error:");

    if (error.response) {
      console.log(error.response.body);
    } else {
      console.log(error);
    }
  }
};