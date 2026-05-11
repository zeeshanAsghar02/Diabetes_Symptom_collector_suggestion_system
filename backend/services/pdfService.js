import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateOnboardingReportPDF(userName, diseaseName, symptomMap) {
    return new Promise((resolve, reject) => {
        try {
            // Create a unique filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `onboarding-report-${userName.replace(/\s+/g, '-')}-${timestamp}.pdf`;
            const filepath = path.join(__dirname, '..', 'temp', filename);
            
            // Ensure temp directory exists
            const tempDir = path.join(__dirname, '..', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Diabetes Symptom Collector - Onboarding Report',
                    Author: 'Diabetes Symptom Collector System',
                    Subject: `Onboarding Report for ${userName}`,
                    Keywords: 'diabetes, symptoms, health, report',
                    CreationDate: new Date()
                }
            });
            
            // Pipe to file
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);
            
            // Add header
            doc.fontSize(24)
               .font('Helvetica-Bold')
               .fillColor('#1976d2')
               .text('Diabetes Symptom Collector', { align: 'center' });
            
            doc.moveDown(0.5);
            doc.fontSize(16)
               .font('Helvetica')
               .fillColor('#333')
               .text('Onboarding Completion Report', { align: 'center' });
            
            doc.moveDown(1);
            
            // Add user and disease information
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#1976d2')
               .text('Patient Information');
            
            doc.moveDown(0.5);
            doc.fontSize(12)
               .font('Helvetica')
               .fillColor('#333')
               .text(`Name: ${userName}`);
            doc.text(`Disease: ${diseaseName}`);
            doc.text(`Report Date: ${new Date().toLocaleDateString()}`);
            doc.text(`Report Time: ${new Date().toLocaleTimeString()}`);
            
            doc.moveDown(1);
            
            // Add completion status
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#28a745')
               .text('✓ Onboarding Status: COMPLETED (100%)');
            
            doc.moveDown(1);
            
            // Add symptoms and questions
            if (symptomMap && Object.keys(symptomMap).length > 0) {
                doc.fontSize(16)
                   .font('Helvetica-Bold')
                   .fillColor('#1976d2')
                   .text('Submitted Details');
                
                doc.moveDown(0.5);
                
                let yPosition = doc.y;
                let pageNumber = 1;
                
                for (const [symptom, questions] of Object.entries(symptomMap)) {
                    // Check if we need a new page
                    if (yPosition > 650) {
                        doc.addPage();
                        pageNumber++;
                        yPosition = 50;
                        
                        // Add page header
                        doc.fontSize(10)
                           .font('Helvetica')
                           .fillColor('#666')
                           .text(`Page ${pageNumber}`, 0, 20, { align: 'right' });
                    }
                    
                    // Symptom header
                    doc.fontSize(14)
                       .font('Helvetica-Bold')
                       .fillColor('#1565c0')
                       .text(symptom);
                    
                    doc.moveDown(0.3);
                    
                    // Questions and answers
                    for (const q of questions) {
                        // Check if we need a new page for this question
                        if (yPosition > 700) {
                            doc.addPage();
                            pageNumber++;
                            yPosition = 50;
                            
                            // Add page header
                            doc.fontSize(10)
                               .font('Helvetica')
                               .fillColor('#666')
                               .text(`Page ${pageNumber}`, 0, 20, { align: 'right' });
                        }
                        
                        doc.fontSize(11)
                           .font('Helvetica-Bold')
                           .fillColor('#333')
                           .text(`Q: ${q.question}`);
                        
                        doc.moveDown(0.2);
                        
                        doc.fontSize(11)
                           .font('Helvetica')
                           .fillColor('#1976d2')
                           .text(`A: ${q.answer}`);
                        
                        doc.moveDown(0.5);
                        yPosition = doc.y;
                    }
                    
                    doc.moveDown(0.5);
                    yPosition = doc.y;
                }
            }
            
            doc.moveDown(1);
            
            // Add footer information
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#666')
               .text('Important Notes:', { underline: true });
            
            doc.moveDown(0.3);
            doc.fontSize(9)
               .text('• This report contains all details submitted during the onboarding process');
            doc.text('• You can edit your responses within 7 days from completion');
            doc.text('• After 7 days, your data will be submitted and cannot be changed');
            doc.text('• Keep this report for your records');
            
            doc.moveDown(1);
            
            // Add system footer
            doc.fontSize(8)
               .font('Helvetica')
               .fillColor('#999')
               .text(`Generated by Diabetes Symptom Collector System`, { align: 'center' });
            doc.text(`Report ID: ${timestamp}`, { align: 'center' });
            
            // Finalize PDF
            doc.end();
            
            stream.on('finish', () => {
                resolve({ filepath, filename });
            });
            
            stream.on('error', (error) => {
                reject(error);
            });
            
        } catch (error) {
            reject(error);
        }
    });
}

// Clean up temporary PDF files (optional utility function)
export function cleanupTempPDF(filepath) {
    try {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    } catch (error) {
        console.error('Error cleaning up temp PDF:', error);
    }
} 