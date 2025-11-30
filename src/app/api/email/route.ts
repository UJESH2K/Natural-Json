import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, workflowId, actionId } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: "Email address and message are required" },
        { status: 400 }
      );
    }

    console.log(`📧 Email notification request:`, { to, subject: subject || 'Trading Workflow Alert' });

    // Send the email
    const success = await emailService.sendWorkflowNotification({
      to,
      subject: subject || 'Trading Workflow Alert',
      message,
      workflowId,
      actionId
    });

    if (success) {
      return NextResponse.json({ 
        ok: true, 
        message: "Email sent successfully",
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error.message || "Email service error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test email connectivity
    const isConnected = await emailService.testConnection();
    
    return NextResponse.json({
      status: isConnected ? 'connected' : 'disconnected',
      service: process.env.SMTP_SERVICE || 'gmail',
      email: process.env.SMTP_EMAIL || 'not configured'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Email service error" },
      { status: 500 }
    );
  }
}