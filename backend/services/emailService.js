import nodemailer from 'nodemailer';
import { cleanupTemporaryFile } from './pdfGenerationService.js';

export async function sendActivationEmail(email, token) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    const activationUrl = `${process.env.FRONTEND_URL}/activate/${token}`;
    const html = `
    <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 32px;">
        <h2 style="color: #1e2a3a; text-align: center; margin-bottom: 24px;">Welcome to Diabetes Symptom Collector!</h2>
        <p style="color: #333; font-size: 16px;">Thank you for registering. Please activate your account by clicking the button below:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${activationUrl}" style="display: inline-block; padding: 14px 32px; background: #1976d2; color: #fff; border-radius: 4px; font-size: 16px; text-decoration: none; font-weight: bold; letter-spacing: 1px;">Activate Account</a>
        </div>
        <p style="color: #888; font-size: 14px;">If the button above does not work, copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #1976d2; font-size: 14px;">${activationUrl}</p>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #aaa; font-size: 13px; text-align: center;">&copy; ${new Date().getFullYear()} Diabetes Symptom Collector. All rights reserved.</p>
      </div>
    </div>
    `;
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Activate your Diabetes Symptom Collector account',
        html
    });
}

export async function sendResetPasswordEmail(email, token) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const html = `
    <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 32px;">
        <h2 style="color: #1e2a3a; text-align: center; margin-bottom: 24px;">Reset Your Password</h2>
        <p style="color: #333; font-size: 16px;">We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #1976d2; color: #fff; border-radius: 4px; font-size: 16px; text-decoration: none; font-weight: bold; letter-spacing: 1px;">Reset Password</a>
        </div>
        <p style="color: #888; font-size: 14px;">If you did not request this, you can safely ignore this email.</p>
        <p style="color: #888; font-size: 14px;">If the button above does not work, copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #1976d2; font-size: 14px;">${resetUrl}</p>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #aaa; font-size: 13px; text-align: center;">&copy; ${new Date().getFullYear()} Diabetes Symptom Collector. All rights reserved.</p>
      </div>
    </div>
    `;
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Reset your Diabetes Symptom Collector password',
        html
    });
}

export async function sendOnboardingCompletionEmail(email, userName, diseaseName, symptomMap) {
    console.log('📧 Email service configuration:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER ? '***configured***' : 'NOT CONFIGURED',
        pass: process.env.SMTP_PASS ? '***configured***' : 'NOT CONFIGURED'
    });

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP configuration is incomplete. Please check your .env file.');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // Generate PDF report
    const { generateOnboardingReportPDF, cleanupTempPDF } = await import('./pdfService.js');
    let pdfFilepath = null;
    let pdfFilename = null;

    try {
        console.log('📄 Generating PDF report...');
        const pdfResult = await generateOnboardingReportPDF(userName, diseaseName, symptomMap);
        pdfFilepath = pdfResult.filepath;
        pdfFilename = pdfResult.filename;
        console.log('📄 PDF generated successfully:', pdfFilename);
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        console.log('📄 Continuing without PDF attachment...');
        // Continue without PDF if generation fails
    }

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; padding: 40px 0;">
      <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(25, 118, 210, 0.10); padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src='https://img.icons8.com/color/96/000000/checked--v2.png' alt='Completed' style='width: 64px; height: 64px;'/>
        </div>
        <h2 style="color: #1976d2; text-align: center; margin-bottom: 16px;">Congratulations, ${userName}!</h2>
        <p style="color: #333; font-size: 18px; text-align: center; margin-bottom: 24px;">You have successfully completed <b>100% of your details</b> for <b>${diseaseName}</b> in the Diabetes Symptom Collector system.</p>
        
        <div style="background: #fff3cd; border-radius: 8px; padding: 18px 24px; margin-bottom: 18px; border: 1px solid #ffe082;">
          <p style="color: #b26a00; font-size: 16px; text-align: center; margin: 0; font-weight: 600;">
            <span style="display: inline-block; vertical-align: middle; margin-right: 8px;">⏰</span>
            <b>You can edit your details within 7 days from now. After that, your data will be submitted and can no longer be changed.</b>
          </p>
        </div>
        
        <div style="background: #e3f0ff; border-radius: 8px; padding: 18px 24px; margin-bottom: 24px;">
          <p style="color: #1976d2; font-size: 16px; text-align: center; margin: 0;">You can now view and edit your responses anytime in your dashboard.</p>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 18px 24px; margin-bottom: 24px; border: 1px solid #e9ecef;">
          <p style="color: #495057; font-size: 16px; text-align: center; margin: 0;">
            <span style="display: inline-block; vertical-align: middle; margin-right: 8px;">📎</span>
            <b>A detailed PDF report with all your submitted information has been attached to this email.</b>
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 14px 36px; background: #1976d2; color: #fff; border-radius: 6px; font-size: 17px; text-decoration: none; font-weight: bold; letter-spacing: 1px; box-shadow: 0 2px 8px rgba(25, 118, 210, 0.10);">Go to Dashboard</a>
        </div>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #aaa; font-size: 13px; text-align: center;">&copy; ${new Date().getFullYear()} Diabetes Symptom Collector. All rights reserved.</p>
      </div>
    </div>
    `;

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: '🎉 Details 100% Completed - Diabetes Symptom Collector',
        html
    };

    // Add PDF attachment if generated successfully
    if (pdfFilepath && pdfFilename) {
        mailOptions.attachments = [{
            filename: pdfFilename,
            path: pdfFilepath,
            contentType: 'application/pdf'
        }];
    }

    console.log('📧 Sending email with options:', {
        to: email,
        subject: mailOptions.subject,
        hasAttachment: !!mailOptions.attachments
    });
    
    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        console.error('❌ Full error details:', error);
        throw error;
    }

    // Clean up the temporary PDF file after sending
    if (pdfFilepath) {
        setTimeout(() => {
            cleanupTempPDF(pdfFilepath);
        }, 5000); // Clean up after 5 seconds
    }
}

/**
 * Send Diet Plan Email with PDF Attachment
 * @param {string} email - User's email address
 * @param {string} userName - User's full name
 * @param {string} pdfFilepath - Path to generated PDF
 * @param {Object} dietPlan - Diet plan object with date info
 */
export async function sendDietPlanEmail(email, userName, pdfFilepath, dietPlan) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const planDate = dietPlan.target_date ? new Date(dietPlan.target_date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }) : 'Today';

    const html = `
    <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🥗 Diet Plan Ready!</h1>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Dear ${userName},</p>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Your personalized diet plan for <strong>${planDate}</strong> has been successfully generated and is ready for you!
        </p>
        
        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="color: #1e40af; margin: 0; font-size: 15px;">
            <strong>📎 Your diet plan is attached to this email as a PDF.</strong>
          </p>
          <p style="color: #1e40af; margin: 8px 0 0 0; font-size: 14px;">
            You can download and print it for easy reference throughout your day.
          </p>
        </div>
        
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
          This plan has been carefully crafted based on your:
        </p>
        <ul style="color: #555; font-size: 15px; line-height: 1.8;">
          <li>Personal health profile</li>
          <li>Nutritional requirements</li>
          <li>Regional food availability</li>
          <li>Dietary preferences</li>
        </ul>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_URL}/personalized-system/diet" style="display: inline-block; padding: 14px 36px; background: #059669; color: #fff; border-radius: 6px; font-size: 17px; text-decoration: none; font-weight: bold; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.15);">View in Dashboard</a>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>💡 Tip:</strong> Consistency is key! Try to follow your meal plan as closely as possible for the best results.
          </p>
        </div>
        
        <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 24px;">
          If you have any questions or concerns about your diet plan, please consult with your healthcare provider.
        </p>
        
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #aaa; font-size: 13px; text-align: center;">&copy; ${new Date().getFullYear()} Diabetes Symptom Collector. All rights reserved.</p>
      </div>
    </div>
    `;

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: '🥗 Your Personalized Diet Plan is Ready - Diabetes Symptom Collector',
        html,
        attachments: [{
            filename: `Diet_Plan_${new Date().toISOString().split('T')[0]}.pdf`,
            path: pdfFilepath,
            contentType: 'application/pdf'
        }]
    };

    console.log('📧 Sending diet plan email to:', email);
    
    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Diet plan email sent successfully!');
    } catch (error) {
        console.error('❌ Diet plan email sending failed:', error.message);
        throw error;
    }

    // Clean up the temporary PDF file after sending
    setTimeout(() => {
        cleanupTemporaryFile(pdfFilepath);
    }, 5000);
}

/**
 * Send Exercise Plan Email with PDF Attachment
 * @param {string} email - User's email address
 * @param {string} userName - User's full name
 * @param {string} pdfFilepath - Path to generated PDF
 * @param {Object} exercisePlan - Exercise plan object with date info
 */
export async function sendExercisePlanEmail(email, userName, pdfFilepath, exercisePlan) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const planDate = exercisePlan.target_date ? new Date(exercisePlan.target_date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }) : 'Today';

    const html = `
    <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">🏃 Exercise Plan Ready!</h1>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Dear ${userName},</p>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Your personalized exercise plan for <strong>${planDate}</strong> has been successfully generated!
        </p>
        
        <div style="background: #f3e8ff; border-left: 4px solid #7c3aed; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="color: #5b21b6; margin: 0; font-size: 15px;">
            <strong>📎 Your exercise plan is attached to this email as a PDF.</strong>
          </p>
          <p style="color: #5b21b6; margin: 8px 0 0 0; font-size: 14px;">
            Print it out or save it to your phone for easy access during your workout!
          </p>
        </div>
        
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
          This exercise plan is tailored to your:
        </p>
        <ul style="color: #555; font-size: 15px; line-height: 1.8;">
          <li>Current fitness level</li>
          <li>Health conditions</li>
          <li>Personal preferences</li>
          <li>Safety considerations</li>
        </ul>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_URL}/personalized-system/exercise" style="display: inline-block; padding: 14px 36px; background: #7c3aed; color: #fff; border-radius: 6px; font-size: 17px; text-decoration: none; font-weight: bold; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);">View in Dashboard</a>
        </div>
        
        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="color: #991b1b; margin: 0; font-size: 14px;">
            <strong>⚠️ Safety First:</strong> Always warm up before exercising and stop immediately if you feel dizzy, short of breath, or experience chest pain. Consult your doctor before starting any new exercise program.
          </p>
        </div>
        
        <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 24px;">
          Stay consistent with your exercise routine for optimal health benefits. You've got this! 💪
        </p>
        
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #aaa; font-size: 13px; text-align: center;">&copy; ${new Date().getFullYear()} Diabetes Symptom Collector. All rights reserved.</p>
      </div>
    </div>
    `;

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: '🏃 Your Personalized Exercise Plan is Ready - Diabetes Symptom Collector',
        html,
        attachments: [{
            filename: `Exercise_Plan_${new Date().toISOString().split('T')[0]}.pdf`,
            path: pdfFilepath,
            contentType: 'application/pdf'
        }]
    };

    console.log('📧 Sending exercise plan email to:', email);
    
    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Exercise plan email sent successfully!');
    } catch (error) {
        console.error('❌ Exercise plan email sending failed:', error.message);
        throw error;
    }

    // Clean up the temporary PDF file after sending
    setTimeout(() => {
        cleanupTemporaryFile(pdfFilepath);
    }, 5000);
}

/**
 * Send Lifestyle Tips Email with PDF Attachment
 * @param {string} email - User's email address
 * @param {string} userName - User's full name
 * @param {string} pdfFilepath - Path to generated PDF
 * @param {Object} lifestyleTips - Lifestyle tips object with date info
 */
export async function sendLifestyleTipsEmail(email, userName, pdfFilepath, lifestyleTips) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const tipsDate = lifestyleTips.target_date ? new Date(lifestyleTips.target_date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }) : 'Today';

    const html = `
    <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #10b981; margin: 0; font-size: 28px;">💡 Lifestyle Tips Ready!</h1>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Dear ${userName},</p>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Your personalized lifestyle recommendations for <strong>${tipsDate}</strong> are now available!
        </p>
        
        <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="color: #065f46; margin: 0; font-size: 15px;">
            <strong>📎 Your lifestyle tips guide is attached to this email as a PDF.</strong>
          </p>
          <p style="color: #065f46; margin: 8px 0 0 0; font-size: 14px;">
            Keep it handy as a reference for better health management throughout your day.
          </p>
        </div>
        
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
          These recommendations cover essential areas including:
        </p>
        <ul style="color: #555; font-size: 15px; line-height: 1.8;">
          <li>Sleep hygiene and rest</li>
          <li>Stress management techniques</li>
          <li>Daily health monitoring</li>
          <li>Preventive care practices</li>
        </ul>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_URL}/personalized-system/lifestyle" style="display: inline-block; padding: 14px 36px; background: #10b981; color: #fff; border-radius: 6px; font-size: 17px; text-decoration: none; font-weight: bold; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);">View in Dashboard</a>
        </div>
        
        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="color: #1e40af; margin: 0; font-size: 14px;">
            <strong>🌟 Remember:</strong> Small, consistent lifestyle changes lead to significant long-term health improvements. Take it one day at a time!
          </p>
        </div>
        
        <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 24px;">
          Your health journey is unique. These tips are personalized to help you achieve your wellness goals.
        </p>
        
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #aaa; font-size: 13px; text-align: center;">&copy; ${new Date().getFullYear()} Diabetes Symptom Collector. All rights reserved.</p>
      </div>
    </div>
    `;

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: '💡 Your Personalized Lifestyle Tips are Ready - Diabetes Symptom Collector',
        html,
        attachments: [{
            filename: `Lifestyle_Tips_${new Date().toISOString().split('T')[0]}.pdf`,
            path: pdfFilepath,
            contentType: 'application/pdf'
        }]
    };

    console.log('📧 Sending lifestyle tips email to:', email);
    
    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Lifestyle tips email sent successfully!');
    } catch (error) {
        console.error('❌ Lifestyle tips email sending failed:', error.message);
        throw error;
    }

    // Clean up the temporary PDF file after sending
    setTimeout(() => {
        cleanupTemporaryFile(pdfFilepath);
    }, 5000);
}

/**
 * Send Risk Assessment Email with PDF Attachment
 * @param {string} email - User's email address
 * @param {string} userName - User's full name
 * @param {string} riskLevel - Risk level (low/medium/high)
 * @param {string} pdfFilepath - Path to generated PDF
 */
export async function sendRiskAssessmentEmail(email, userName, riskLevel, pdfFilepath) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const riskColors = {
        'low': { color: '#059669', bg: '#d1fae5', emoji: '✅' },
        'medium': { color: '#f59e0b', bg: '#fed7aa', emoji: '⚠️' },
        'high': { color: '#dc2626', bg: '#fee2e2', emoji: '🔴' }
    };

    const riskInfo = riskColors[riskLevel.toLowerCase()] || riskColors['medium'];

    const html = `
    <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">⚕️ Medical Risk Assessment Complete</h1>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Dear ${userName},</p>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Thank you for completing your comprehensive health assessment. Your detailed medical risk report is now ready.
        </p>
        
        <div style="background: ${riskInfo.bg}; border-left: 4px solid ${riskInfo.color}; padding: 20px; margin: 24px 0; border-radius: 4px; text-align: center;">
          <p style="color: ${riskInfo.color}; margin: 0; font-size: 18px; font-weight: bold;">
            ${riskInfo.emoji} Your Risk Level: ${riskLevel.toUpperCase()}
          </p>
        </div>
        
        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="color: #1e40af; margin: 0; font-size: 15px;">
            <strong>📎 Your comprehensive medical report is attached to this email as a PDF.</strong>
          </p>
          <p style="color: #1e40af; margin: 8px 0 0 0; font-size: 14px;">
            This report includes your risk assessment, health profile, and personalized recommendations.
          </p>
        </div>
        
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
          Your report contains:
        </p>
        <ul style="color: #555; font-size: 15px; line-height: 1.8;">
          <li>Complete risk assessment analysis</li>
          <li>Your health and medical history</li>
          <li>Personalized clinical recommendations</li>
          <li>Next steps for your health journey</li>
        </ul>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 14px 36px; background: #dc2626; color: #fff; border-radius: 6px; font-size: 17px; text-decoration: none; font-weight: bold; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);">View Dashboard</a>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>⚠️ Important:</strong> This report is for informational purposes and does not replace professional medical advice. Please share this report with your healthcare provider during your next consultation.
          </p>
        </div>
        
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
          <strong>What's Next?</strong>
        </p>
        <ul style="color: #555; font-size: 15px; line-height: 1.8;">
          <li>Review your personalized recommendations</li>
          <li>Schedule an appointment with your healthcare provider</li>
          <li>Start implementing the suggested lifestyle changes</li>
          <li>Use our personalized diet, exercise, and lifestyle plans</li>
        </ul>
        
        <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 24px;">
          We're here to support you on your health journey. Take care and stay healthy!
        </p>
        
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #aaa; font-size: 13px; text-align: center;">&copy; ${new Date().getFullYear()} Diabetes Symptom Collector. All rights reserved.</p>
      </div>
    </div>
    `;

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: '⚕️ Your Medical Risk Assessment Report - Diabetes Symptom Collector',
        html,
        attachments: [{
            filename: `Medical_Risk_Assessment_Report_${new Date().toISOString().split('T')[0]}.pdf`,
            path: pdfFilepath,
            contentType: 'application/pdf'
        }]
    };

    console.log('📧 Sending risk assessment email to:', email);
    
    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Risk assessment email sent successfully!');
    } catch (error) {
        console.error('❌ Risk assessment email sending failed:', error.message);
        throw error;
    }

    // Clean up the temporary PDF file after sending
    setTimeout(() => {
        cleanupTemporaryFile(pdfFilepath);
    }, 5000);
} 