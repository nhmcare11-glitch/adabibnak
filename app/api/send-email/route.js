import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { message, name, email } = await request.json();

    // Create transporter (using Gmail SMTP as example)
    // You can use any SMTP service: SendGrid, Mailgun, etc.
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,      // Your Gmail address
        pass: process.env.EMAIL_PASSWORD,   // Your Gmail App Password
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "nhm.care11@gmail.com",
      subject: "رسالة جديدة من موقع Adabibnek",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2DBFB8;">رسالة جديدة من موقع Adabibnek</h2>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />

          <p><strong>المرسل:</strong> ${name || "زائر"}</p>
          <p><strong>البريد:</strong> ${email || "غير متوفر"}</p>
          <p><strong>التاريخ:</strong> ${new Date().toLocaleString("ar-DZ")}</p>

          <hr style="border: 1px solid #eee; margin: 20px 0;" />

          <h3 style="color: #062220;">محتوى الرسالة:</h3>
          <div style="background: #f5f7f9; padding: 15px; border-radius: 8px; line-height: 1.6;">
            ${message.replace(/\n/g, "<br>")}
          </div>

          <hr style="border: 1px solid #eee; margin: 20px 0;" />

          <p style="color: #6b7a7a; font-size: 12px;">
            تم إرسال هذه الرسالة تلقائياً من موقع Adabibnek
          </p>
        </div>
      `,
      text: `رسالة من Adabibnek:\n\n${message}\n\nالمرسل: ${name || "زائر"}\nالبريد: ${email || "غير متوفر"}`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { success: true, message: "تم إرسال الرسالة بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { success: false, error: "فشل إرسال الرسالة" },
      { status: 500 }
    );
  }
}