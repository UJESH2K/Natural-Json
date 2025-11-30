// Simple test for email service
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing email configuration...');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ujeshyadav007@gmail.com',
      pass: 'your-app-password'  // This needs to be a real Gmail app password
    }
  });

  try {
    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection successful');
    
    // Send test email
    const info = await transporter.sendMail({
      from: 'ujeshyadav007@gmail.com',
      to: 'ujeshyadav007@gmail.com',
      subject: '🧪 Email Test from Trading Workflow Builder',
      html: `
        <h2>✅ Email Integration Test</h2>
        <p>This is a test email to verify that the email service is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you received this email, the integration is working! 🎉</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('\n📝 Troubleshooting steps:');
    console.log('1. Enable 2-Factor Authentication on your Gmail account');
    console.log('2. Go to Google Account Settings > Security');
    console.log('3. Generate an "App Password" specifically for this application');
    console.log('4. Update SMTP_PASSWORD in .env.local with the 16-character app password');
    console.log('5. Make sure SMTP_EMAIL matches your Gmail address');
  }
}

testEmail();