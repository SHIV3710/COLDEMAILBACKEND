const express = require("express");
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const dotenv = require("dotenv");

const app = express();

dotenv.config();
app.use(express.json());
app.use(cors("*"));

// Default PDF file path
const defaultPDFPath = path.join(__dirname, "uploads/SHIV_KUMAR_RESUME.pdf");

app.get("/", (req, res) => {
  res.send("APP RUNNING ON PORT 5000");
});

app.post("/send-email", (req, res) => {
  const { email, subject, message, schedule: scheduleTime } = req.body;

  console.log(email, subject, message);
  if (!email || !subject || !message) {
    return res.status(400).send("Email, subject, and message are required.");
  }

  // Check if the default PDF exists
  if (!fs.existsSync(defaultPDFPath)) {
    return res.status(500).send("Default PDF file not found.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER, // Your Gmail address
      pass: process.env.PASS // Your Gmail app password (NOT your regular password)
    }
  });

  const mailOptions = {
    from: process.env.USER,
    to: email,
    subject,
    text: message,
    attachments: [{ path: defaultPDFPath }]
  };

  if (scheduleTime) {
    const validDate = new Date(scheduleTime);

    if (isNaN(validDate)) {
      return res.status(400).send("Invalid schedule time.");
    }

    // Schedule the email
    schedule.scheduleJob(validDate, () => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Scheduled email sent:", info.response);
        }
      });
    });

    return res.send("Email scheduled successfully!");
  } else {
    // Send email immediately
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).send("Failed to send email.");
      }
      console.log("Email sent:", info.response);
      res.send("Email sent successfully!");
    });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
