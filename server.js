const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'services.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'pricing.html'));
});

app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'gallery.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  // For now, log the contact request
  // To enable email, configure the transporter below with your email credentials
  console.log('Contact form submission:', { name, email, phone, message });

  /*
  // Uncomment and configure to enable email notifications
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password'
    }
  });

  await transporter.sendMail({
    from: email,
    to: 'your-email@gmail.com',
    subject: `New Contact from ${name} - D&G Soft Wash`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`
  });
  */

  res.json({ success: true, message: 'Thank you for your message! We will get back to you soon.' });
});

app.listen(PORT, () => {
  console.log(`D&G Soft Wash website running at http://localhost:${PORT}`);
});
