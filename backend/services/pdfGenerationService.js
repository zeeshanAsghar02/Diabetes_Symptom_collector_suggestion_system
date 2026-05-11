import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PDF Generation Service
 * Handles creation of professional PDF reports for diet plans, exercise plans, 
 * lifestyle tips, and risk assessments
 */

/**
 * Generate Diet Plan PDF Report
 * @param {Object} dietPlan - Diet plan document from database
 * @param {Object} userInfo - User information (name, email, etc.)
 * @returns {Promise<string>} - Path to generated PDF file
 */
const generateDietPlanPDF = async (dietPlan, userInfo) => {
    return new Promise((resolve, reject) => {
        try {
            // Create temporary directory if it doesn't exist
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Generate unique filename
            const timestamp = Date.now();
            const fileName = `diet-plan-${dietPlan._id}-${timestamp}.pdf`;
            const filePath = path.join(tempDir, fileName);

            // Create PDF document
            const doc = new PDFDocument({ 
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header - Brand
            doc.fontSize(24)
               .fillColor('#2563eb')
               .text('Diabetes Symptom Collector', { align: 'center' });
            
            doc.fontSize(18)
               .fillColor('#1e40af')
               .text('Personalized Diet Plan Report', { align: 'center' });
            
            doc.moveDown(0.5);
            doc.strokeColor('#e5e7eb')
               .lineWidth(2)
               .moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke();
            
            doc.moveDown(1);

            // Patient Information Section
            doc.fontSize(12)
               .fillColor('#374151')
               .text('Patient Information', { underline: true });
            
            doc.moveDown(0.3);
            doc.fontSize(10)
               .fillColor('#6b7280')
               .text(`Name: ${userInfo.fullName}`, { continued: false })
               .text(`Email: ${userInfo.email}`)
               .text(`Region: ${dietPlan.region || 'Not specified'}`)
               .text(`Plan Date: ${dietPlan.target_date ? new Date(dietPlan.target_date).toLocaleDateString('en-US', { 
                   weekday: 'long', 
                   year: 'numeric', 
                   month: 'long', 
                   day: 'numeric' 
               }) : 'N/A'}`)
               .text(`Generated: ${new Date(dietPlan.generated_at).toLocaleString('en-US', {
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit'
               })}`);
            
            doc.moveDown(1);

            // Daily Calorie Target Box
            doc.roundedRect(50, doc.y, 495, 50, 5)
               .fillAndStroke('#dbeafe', '#2563eb');
            
            const boxY = doc.y + 15;
            doc.fontSize(12)
               .fillColor('#1e40af')
               .text('Daily Calorie Target', 60, boxY, { align: 'left' });
            
            doc.fontSize(20)
               .fillColor('#1e40af')
               .text(`${dietPlan.total_calories || 0} kcal`, 400, boxY, { align: 'right', width: 135 });
            
            doc.y += 50;
            doc.moveDown(1);

            // Meals Section
            doc.fontSize(14)
               .fillColor('#374151')
               .text('Meal Plan', { underline: true });
            
            doc.moveDown(0.5);

            if (dietPlan.meals && dietPlan.meals.length > 0) {
                dietPlan.meals.forEach((meal, mealIndex) => {
                    // Check if we need a new page
                    if (doc.y > 700) {
                        doc.addPage();
                    }

                    // Meal Header
                    doc.fontSize(12)
                       .fillColor('#ffffff')
                       .rect(50, doc.y, 495, 25)
                       .fill('#059669');
                    
                    const mealHeaderY = doc.y + 7;
                    doc.fontSize(11)
                       .fillColor('#ffffff')
                       .text(meal.name || `Meal ${mealIndex + 1}`, 60, mealHeaderY, { width: 250 });
                    
                    doc.fontSize(9)
                       .text(meal.timing || '', 320, mealHeaderY, { align: 'right', width: 215 });
                    
                    doc.y += 25;
                    doc.moveDown(0.3);

                    // Meal Items
                    if (meal.items && meal.items.length > 0) {
                        meal.items.forEach((item, itemIndex) => {
                            // Check for page break
                            if (doc.y > 720) {
                                doc.addPage();
                            }

                            doc.fontSize(10)
                               .fillColor('#1f2937')
                               .text(`${itemIndex + 1}. ${item.food}`, 60, doc.y, { continued: true })
                               .fillColor('#6b7280')
                               .text(` - ${item.portion}`, { continued: false });
                            
                            // Nutritional info in columns
                            const nutritionY = doc.y;
                            doc.fontSize(8)
                               .fillColor('#9ca3af')
                               .text(`Cal: ${item.calories || 0}`, 70, nutritionY, { width: 70, continued: true })
                               .text(`Carbs: ${item.carbs || 0}g`, { width: 80, continued: true })
                               .text(`Protein: ${item.protein || 0}g`, { width: 90, continued: true })
                               .text(`Fat: ${item.fat || 0}g`, { width: 70, continued: true })
                               .text(`Fiber: ${item.fiber || 0}g`, { width: 70 });
                            
                            doc.moveDown(0.5);
                        });
                    }

                    // Meal Total Calories
                    doc.fontSize(10)
                       .fillColor('#059669')
                       .text(`Total: ${meal.total_calories || 0} kcal`, 60, doc.y, { align: 'right' });
                    
                    doc.moveDown(1);
                });
            } else {
                doc.fontSize(10)
                   .fillColor('#6b7280')
                   .text('No meal data available.');
                doc.moveDown(1);
            }

            // Nutritional Summary
            if (dietPlan.nutritional_totals) {
                // Check for page break
                if (doc.y > 650) {
                    doc.addPage();
                }

                doc.fontSize(14)
                   .fillColor('#374151')
                   .text('Nutritional Summary', { underline: true });
                
                doc.moveDown(0.5);

                const totals = dietPlan.nutritional_totals;
                doc.fontSize(10)
                   .fillColor('#1f2937')
                   .text(`Total Calories: ${totals.calories || 0} kcal`, 60)
                   .text(`Total Carbohydrates: ${totals.carbs || 0}g`, 60)
                   .text(`Total Protein: ${totals.protein || 0}g`, 60)
                   .text(`Total Fat: ${totals.fat || 0}g`, 60)
                   .text(`Total Fiber: ${totals.fiber || 0}g`, 60);
                
                doc.moveDown(1);
            }

            // Dietary Tips
            if (dietPlan.tips && dietPlan.tips.length > 0) {
                // Check for page break
                if (doc.y > 650) {
                    doc.addPage();
                }

                doc.fontSize(14)
                   .fillColor('#374151')
                   .text('Dietary Tips & Recommendations', { underline: true });
                
                doc.moveDown(0.5);

                dietPlan.tips.forEach((tip, index) => {
                    if (doc.y > 720) {
                        doc.addPage();
                    }

                    doc.fontSize(10)
                       .fillColor('#1f2937')
                       .text(`${index + 1}. ${tip}`, 60, doc.y, { width: 485, align: 'left' });
                    
                    doc.moveDown(0.3);
                });

                doc.moveDown(1);
            }

            // Sources Section
            if (dietPlan.sources && dietPlan.sources.length > 0) {
                if (doc.y > 700) {
                    doc.addPage();
                }

                doc.fontSize(12)
                   .fillColor('#374151')
                   .text('Information Sources', { underline: true });
                
                doc.moveDown(0.3);

                doc.fontSize(8)
                   .fillColor('#6b7280')
                   .text('This plan is based on evidence from:', 60);
                
                dietPlan.sources.slice(0, 5).forEach((source, index) => {
                    doc.fontSize(8)
                       .fillColor('#6b7280')
                       .text(`• ${source.title || 'Medical Document'} (${source.country || 'International'})`, 65, doc.y, { width: 475 });
                });

                doc.moveDown(1);
            }

            // Footer
            doc.fontSize(8)
               .fillColor('#9ca3af')
               .text('This diet plan is personalized based on your medical profile and regional food availability.', 50, 770, { 
                   align: 'center',
                   width: 495
               })
               .text('Please consult with your healthcare provider before making significant dietary changes.', { 
                   align: 'center',
                   width: 495
               });

            // Finalize PDF
            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Exercise Plan PDF Report
 * @param {Object} exercisePlan - Exercise plan document from database
 * @param {Object} userInfo - User information
 * @returns {Promise<string>} - Path to generated PDF file
 */
const generateExercisePlanPDF = async (exercisePlan, userInfo) => {
    return new Promise((resolve, reject) => {
        try {
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = Date.now();
            const fileName = `exercise-plan-${exercisePlan._id}-${timestamp}.pdf`;
            const filePath = path.join(tempDir, fileName);

            const doc = new PDFDocument({ 
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(24)
               .fillColor('#2563eb')
               .text('Diabetes Symptom Collector', { align: 'center' });
            
            doc.fontSize(18)
               .fillColor('#1e40af')
               .text('Personalized Exercise Plan Report', { align: 'center' });
            
            doc.moveDown(0.5);
            doc.strokeColor('#e5e7eb')
               .lineWidth(2)
               .moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke();
            
            doc.moveDown(1);

            // Patient Information
            doc.fontSize(12)
               .fillColor('#374151')
               .text('Patient Information', { underline: true });
            
            doc.moveDown(0.3);
            doc.fontSize(10)
               .fillColor('#6b7280')
               .text(`Name: ${userInfo.fullName}`)
               .text(`Email: ${userInfo.email}`)
               .text(`Region: ${exercisePlan.region || 'Not specified'}`)
               .text(`Plan Date: ${exercisePlan.target_date ? new Date(exercisePlan.target_date).toLocaleDateString('en-US', { 
                   weekday: 'long', 
                   year: 'numeric', 
                   month: 'long', 
                   day: 'numeric' 
               }) : 'N/A'}`)
               .text(`Generated: ${new Date(exercisePlan.generated_at).toLocaleString('en-US', {
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit'
               })}`);
            
            doc.moveDown(1);

            // Summary Box
            if (exercisePlan.totals) {
                doc.roundedRect(50, doc.y, 495, 60, 5)
                   .fillAndStroke('#fef3c7', '#f59e0b');
                
                const boxY = doc.y + 10;
                doc.fontSize(11)
                   .fillColor('#92400e')
                   .text('Exercise Summary', 60, boxY);
                
                doc.fontSize(10)
                   .text(`Total Duration: ${exercisePlan.totals.duration_total_min || 0} minutes`, 60, boxY + 20)
                   .text(`Estimated Calories Burned: ${exercisePlan.totals.calories_total || 0} kcal`, 300, boxY + 20)
                   .text(`Number of Sessions: ${exercisePlan.totals.sessions_count || 0}`, 60, boxY + 35);
                
                doc.y += 60;
                doc.moveDown(1);
            }

            // Exercise Sessions
            doc.fontSize(14)
               .fillColor('#374151')
               .text('Exercise Sessions', { underline: true });
            
            doc.moveDown(0.5);

            if (exercisePlan.sessions && exercisePlan.sessions.length > 0) {
                exercisePlan.sessions.forEach((session, sessionIndex) => {
                    if (doc.y > 700) {
                        doc.addPage();
                    }

                    // Session Header
                    doc.fontSize(12)
                       .fillColor('#ffffff')
                       .rect(50, doc.y, 495, 25)
                       .fill('#7c3aed');
                    
                    const sessionHeaderY = doc.y + 7;
                    doc.fontSize(11)
                       .fillColor('#ffffff')
                       .text(session.name || `Session ${sessionIndex + 1}`, 60, sessionHeaderY, { width: 200 });
                    
                    doc.fontSize(9)
                       .text(session.time || '', 270, sessionHeaderY, { width: 130 })
                       .text(`Type: ${session.type || 'General'}`, 410, sessionHeaderY, { width: 125 });
                    
                    doc.y += 25;
                    doc.moveDown(0.3);

                    // Exercise Items
                    if (session.items && session.items.length > 0) {
                        session.items.forEach((item, itemIndex) => {
                            if (doc.y > 720) {
                                doc.addPage();
                            }

                            doc.fontSize(10)
                               .fillColor('#1f2937')
                               .text(`${itemIndex + 1}. ${item.exercise}`, 60, doc.y);
                            
                            doc.fontSize(9)
                               .fillColor('#6b7280')
                               .text(`   Category: ${item.category || 'N/A'} | Duration: ${item.duration_min || 0} min | Intensity: ${item.intensity || 'Moderate'}`, 60)
                               .text(`   Est. Calories: ${item.estimated_calories || 0} kcal | Heart Rate Zone: ${item.heart_rate_zone || 'N/A'}`, 60);
                            
                            if (item.notes) {
                                doc.fontSize(8)
                                   .fillColor('#9ca3af')
                                   .text(`   Notes: ${item.notes}`, 60, doc.y, { width: 475 });
                            }

                            // Precautions
                            if (item.precautions && item.precautions.length > 0) {
                                doc.fontSize(8)
                                   .fillColor('#dc2626')
                                   .text(`   ⚠ Precautions: ${item.precautions.join(', ')}`, 60, doc.y, { width: 475 });
                            }
                            
                            doc.moveDown(0.5);
                        });
                    }

                    // Session Totals
                    doc.fontSize(10)
                       .fillColor('#7c3aed')
                       .text(`Session Total: ${session.total_duration_min || 0} min | ${session.total_estimated_calories || 0} kcal`, 60, doc.y, { align: 'right' });
                    
                    doc.moveDown(1);
                });
            } else {
                doc.fontSize(10)
                   .fillColor('#6b7280')
                   .text('No exercise sessions available.');
                doc.moveDown(1);
            }

            // Tips Section
            if (exercisePlan.tips && exercisePlan.tips.length > 0) {
                if (doc.y > 650) {
                    doc.addPage();
                }

                doc.fontSize(14)
                   .fillColor('#374151')
                   .text('Exercise Tips & Safety Guidelines', { underline: true });
                
                doc.moveDown(0.5);

                exercisePlan.tips.forEach((tip, index) => {
                    if (doc.y > 720) {
                        doc.addPage();
                    }

                    doc.fontSize(10)
                       .fillColor('#1f2937')
                       .text(`${index + 1}. ${tip}`, 60, doc.y, { width: 485 });
                    
                    doc.moveDown(0.3);
                });

                doc.moveDown(1);
            }

            // Sources
            if (exercisePlan.sources && exercisePlan.sources.length > 0) {
                if (doc.y > 700) {
                    doc.addPage();
                }

                doc.fontSize(12)
                   .fillColor('#374151')
                   .text('Information Sources', { underline: true });
                
                doc.moveDown(0.3);

                doc.fontSize(8)
                   .fillColor('#6b7280')
                   .text('This exercise plan is based on guidelines from:', 60);
                
                exercisePlan.sources.slice(0, 5).forEach((source) => {
                    doc.fontSize(8)
                       .fillColor('#6b7280')
                       .text(`• ${source.title || 'Exercise Guideline'} (${source.country || 'International'})`, 65, doc.y, { width: 475 });
                });

                doc.moveDown(1);
            }

            // Footer
            doc.fontSize(8)
               .fillColor('#9ca3af')
               .text('This exercise plan is personalized based on your fitness level and health conditions.', 50, 770, { 
                   align: 'center',
                   width: 495
               })
               .text('Always warm up before exercising and consult your doctor if you experience any discomfort.', { 
                   align: 'center',
                   width: 495
               });

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Lifestyle Tips PDF Report
 * @param {Object} lifestyleTips - Lifestyle tips document from database
 * @param {Object} userInfo - User information
 * @returns {Promise<string>} - Path to generated PDF file
 */
const generateLifestyleTipsPDF = async (lifestyleTips, userInfo) => {
    return new Promise((resolve, reject) => {
        try {
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = Date.now();
            const fileName = `lifestyle-tips-${lifestyleTips._id}-${timestamp}.pdf`;
            const filePath = path.join(tempDir, fileName);

            const doc = new PDFDocument({ 
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(24)
               .fillColor('#2563eb')
               .text('Diabetes Symptom Collector', { align: 'center' });
            
            doc.fontSize(18)
               .fillColor('#1e40af')
               .text('Personalized Lifestyle Tips Report', { align: 'center' });
            
            doc.moveDown(0.5);
            doc.strokeColor('#e5e7eb')
               .lineWidth(2)
               .moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke();
            
            doc.moveDown(1);

            // Patient Information
            doc.fontSize(12)
               .fillColor('#374151')
               .text('Patient Information', { underline: true });
            
            doc.moveDown(0.3);
            doc.fontSize(10)
               .fillColor('#6b7280')
               .text(`Name: ${userInfo.fullName}`)
               .text(`Email: ${userInfo.email}`)
               .text(`Region: ${lifestyleTips.region || 'Not specified'}`)
               .text(`Tips Date: ${lifestyleTips.target_date ? new Date(lifestyleTips.target_date).toLocaleDateString('en-US', { 
                   weekday: 'long', 
                   year: 'numeric', 
                   month: 'long', 
                   day: 'numeric' 
               }) : 'N/A'}`)
               .text(`Generated: ${new Date(lifestyleTips.generated_at).toLocaleString('en-US', {
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit'
               })}`);
            
            doc.moveDown(1.5);

            // Personalized Insights Box
            if (lifestyleTips.personalized_insights && lifestyleTips.personalized_insights.length > 0) {
                doc.roundedRect(50, doc.y, 495, 80, 5)
                   .fillAndStroke('#dbeafe', '#2563eb');
                
                const insightY = doc.y + 10;
                doc.fontSize(11)
                   .fillColor('#1e40af')
                   .text('💡 Personalized Insights', 60, insightY);
                
                doc.moveDown(0.5);
                doc.fontSize(9)
                   .fillColor('#1e3a8a');
                
                lifestyleTips.personalized_insights.slice(0, 3).forEach((insight, index) => {
                    doc.text(`• ${insight}`, 60, doc.y, { width: 475 });
                });
                
                doc.y += 80;
                doc.moveDown(1);
            }

            // Lifestyle Categories
            doc.fontSize(14)
               .fillColor('#374151')
               .text('Lifestyle Recommendations by Category', { underline: true });
            
            doc.moveDown(0.5);

            if (lifestyleTips.categories && lifestyleTips.categories.length > 0) {
                lifestyleTips.categories.forEach((category, categoryIndex) => {
                    if (doc.y > 680) {
                        doc.addPage();
                    }

                    // Category Header with Icon
                    const iconMap = {
                        'sleep_hygiene': '😴',
                        'stress_management': '🧘',
                        'nutrition': '🥗',
                        'physical_activity': '🏃',
                        'monitoring': '📊',
                        'medication_adherence': '💊',
                        'foot_care': '👣',
                        'eye_care': '👁️',
                        'dental_care': '🦷',
                        'social_support': '👥'
                    };
                    
                    const icon = category.icon || iconMap[category.name] || '✨';
                    const displayName = category.name.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');

                    doc.fontSize(13)
                       .fillColor('#ffffff')
                       .rect(50, doc.y, 495, 30)
                       .fill('#10b981');
                    
                    const categoryHeaderY = doc.y + 9;
                    doc.fontSize(12)
                       .fillColor('#ffffff')
                       .text(`${icon} ${displayName}`, 60, categoryHeaderY);
                    
                    doc.y += 30;
                    doc.moveDown(0.5);

                    // Category Tips
                    if (category.tips && category.tips.length > 0) {
                        category.tips.forEach((tip, tipIndex) => {
                            if (doc.y > 720) {
                                doc.addPage();
                            }

                            // Priority indicator
                            const priorityColors = {
                                'high': '#dc2626',
                                'medium': '#f59e0b',
                                'low': '#059669'
                            };
                            const priorityColor = priorityColors[tip.priority] || '#6b7280';
                            const priorityLabel = tip.priority ? tip.priority.toUpperCase() : '';

                            doc.fontSize(11)
                               .fillColor('#1f2937')
                               .text(`${tipIndex + 1}. ${tip.title}`, 60, doc.y, { width: 435, continued: true })
                               .fontSize(8)
                               .fillColor(priorityColor)
                               .text(` [${priorityLabel}]`, { continued: false });
                            
                            if (tip.description) {
                                doc.fontSize(9)
                                   .fillColor('#6b7280')
                                   .text(tip.description, 70, doc.y, { width: 465, align: 'justify' });
                            }
                            
                            doc.moveDown(0.5);
                        });
                    }

                    doc.moveDown(0.5);
                });
            } else {
                doc.fontSize(10)
                   .fillColor('#6b7280')
                   .text('No lifestyle tips available.');
                doc.moveDown(1);
            }

            // Sources
            if (lifestyleTips.sources && lifestyleTips.sources.length > 0) {
                if (doc.y > 700) {
                    doc.addPage();
                }

                doc.fontSize(12)
                   .fillColor('#374151')
                   .text('Information Sources', { underline: true });
                
                doc.moveDown(0.3);

                doc.fontSize(8)
                   .fillColor('#6b7280')
                   .text('These recommendations are based on guidelines from:', 60);
                
                lifestyleTips.sources.slice(0, 5).forEach((source) => {
                    doc.fontSize(8)
                       .fillColor('#6b7280')
                       .text(`• ${source.title || 'Lifestyle Guideline'} (${source.country || 'International'})`, 65, doc.y, { width: 475 });
                });

                doc.moveDown(1);
            }

            // Footer
            doc.fontSize(8)
               .fillColor('#9ca3af')
               .text('These lifestyle tips are personalized to support your diabetes management journey.', 50, 770, { 
                   align: 'center',
                   width: 495
               })
               .text('Consistency is key - small daily changes lead to significant long-term improvements.', { 
                   align: 'center',
                   width: 495
               });

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Risk Assessment Medical Report PDF
 * @param {Object} user - User document
 * @param {Object} personalInfo - UserPersonalInfo document (decrypted)
 * @param {Object} medicalInfo - UserMedicalInfo document (decrypted)
 * @param {Object} riskData - Risk assessment data
 * @returns {Promise<string>} - Path to generated PDF file
 */
const generateRiskAssessmentPDF = async (user, personalInfo, medicalInfo, riskData) => {
    return new Promise((resolve, reject) => {
        try {
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = Date.now();
            const fileName = `risk-assessment-${user._id}-${timestamp}.pdf`;
            const filePath = path.join(tempDir, fileName);

            const doc = new PDFDocument({ 
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(24)
               .fillColor('#2563eb')
               .text('Diabetes Symptom Collector', { align: 'center' });
            
            doc.fontSize(18)
               .fillColor('#dc2626')
               .text('Medical Risk Assessment Report', { align: 'center' });
            
            doc.moveDown(0.5);
            doc.strokeColor('#e5e7eb')
               .lineWidth(2)
               .moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke();
            
            doc.moveDown(1);

            // Confidential Notice
            doc.roundedRect(50, doc.y, 495, 30, 3)
               .fillAndStroke('#fee2e2', '#dc2626');
            
            doc.fontSize(9)
               .fillColor('#991b1b')
               .text('⚕️ CONFIDENTIAL MEDICAL DOCUMENT - For Patient Use Only', 55, doc.y + 10, { align: 'center', width: 485 });
            
            doc.y += 30;
            doc.moveDown(1);

            // Patient Demographics
            doc.fontSize(13)
               .fillColor('#374151')
               .text('Patient Information', { underline: true });
            
            doc.moveDown(0.3);

            // Calculate age if DOB available
            let age = 'N/A';
            if (personalInfo && personalInfo.date_of_birth) {
                const dob = new Date(personalInfo.date_of_birth);
                const today = new Date();
                age = today.getFullYear() - dob.getFullYear();
                const monthDiff = today.getMonth() - dob.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
            }

            doc.fontSize(10)
               .fillColor('#1f2937')
               .text(`Name: ${user.fullName}`, 60)
               .text(`Email: ${user.email}`, 60)
               .text(`Age: ${age} years`, 60)
               .text(`Gender: ${personalInfo?.gender || 'Not specified'}`, 60)
               .text(`Country: ${user.country || 'Not specified'}`, 60)
               .text(`Assessment Date: ${new Date().toLocaleDateString('en-US', {
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit'
               })}`, 60);
            
            doc.moveDown(1);

            // Risk Assessment Result - Prominent Box
            const riskLevel = riskData.risk_level || user.last_assessment_risk_level || 'Unknown';
            const riskProbability = riskData.probability || user.last_assessment_probability || 0;
            
            const riskColors = {
                'low': { bg: '#d1fae5', border: '#059669', text: '#065f46' },
                'medium': { bg: '#fed7aa', border: '#f59e0b', text: '#92400e' },
                'high': { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' }
            };
            
            const colors = riskColors[riskLevel.toLowerCase()] || riskColors['medium'];

            doc.roundedRect(50, doc.y, 495, 80, 5)
               .fillAndStroke(colors.bg, colors.border);
            
            const riskBoxY = doc.y + 15;
            doc.fontSize(14)
               .fillColor(colors.text)
               .text('DIABETES RISK ASSESSMENT', 60, riskBoxY, { align: 'center', width: 475 });
            
            doc.fontSize(22)
               .fillColor(colors.text)
               .text(riskLevel.toUpperCase() + ' RISK', 60, riskBoxY + 25, { align: 'center', width: 475 });
            
            doc.fontSize(12)
               .fillColor(colors.text)
               .text(`Risk Probability: ${(riskProbability * 100).toFixed(1)}%`, 60, riskBoxY + 52, { align: 'center', width: 475 });
            
            doc.y += 80;
            doc.moveDown(1.5);

            // Clinical Summary
            doc.fontSize(13)
               .fillColor('#374151')
               .text('Clinical Summary', { underline: true });
            
            doc.moveDown(0.5);

            if (personalInfo) {
                doc.fontSize(11)
                   .fillColor('#1f2937')
                   .text('Physical Profile:', 60, doc.y, { underline: true });
                
                doc.fontSize(10)
                   .fillColor('#4b5563')
                   .text(`Height: ${personalInfo.height || 'N/A'} cm`, 70)
                   .text(`Weight: ${personalInfo.weight || 'N/A'} kg`, 70);
                
                // Calculate BMI if available
                if (personalInfo.height && personalInfo.weight) {
                    const heightM = personalInfo.height / 100;
                    const bmi = (personalInfo.weight / (heightM * heightM)).toFixed(1);
                    doc.text(`BMI: ${bmi}`, 70);
                }

                doc.text(`Activity Level: ${personalInfo.activity_level || 'N/A'}`, 70)
                   .text(`Dietary Preference: ${personalInfo.dietary_preference || 'N/A'}`, 70);
                
                doc.moveDown(0.8);

                doc.fontSize(11)
                   .fillColor('#1f2937')
                   .text('Lifestyle Factors:', 60, doc.y, { underline: true });
                
                doc.fontSize(10)
                   .fillColor('#4b5563')
                   .text(`Smoking Status: ${personalInfo.smoking_status || 'N/A'}`, 70)
                   .text(`Alcohol Use: ${personalInfo.alcohol_use || 'N/A'}`, 70)
                   .text(`Sleep Hours: ${personalInfo.sleep_hours || 'N/A'} hours/night`, 70);
                
                doc.moveDown(1);
            }

            // Medical History
            if (medicalInfo) {
                if (doc.y > 650) {
                    doc.addPage();
                }

                doc.fontSize(13)
                   .fillColor('#374151')
                   .text('Medical History', { underline: true });
                
                doc.moveDown(0.5);

                if (medicalInfo.diabetes_type) {
                    doc.fontSize(11)
                       .fillColor('#1f2937')
                       .text('Diabetes Information:', 60, doc.y, { underline: true });
                    
                    doc.fontSize(10)
                       .fillColor('#4b5563')
                       .text(`Type: ${medicalInfo.diabetes_type}`, 70);
                    
                    if (medicalInfo.diagnosis_date) {
                        doc.text(`Diagnosed: ${new Date(medicalInfo.diagnosis_date).toLocaleDateString()}`, 70);
                    }
                    
                    doc.moveDown(0.5);
                }

                // Current Medications
                if (medicalInfo.current_medications && medicalInfo.current_medications.length > 0) {
                    doc.fontSize(11)
                       .fillColor('#1f2937')
                       .text('Current Medications:', 60, doc.y, { underline: true });
                    
                    doc.fontSize(9)
                       .fillColor('#4b5563');
                    
                    medicalInfo.current_medications.slice(0, 10).forEach((med, index) => {
                        doc.text(`${index + 1}. ${med.medication_name || 'N/A'} - ${med.dosage || 'N/A'} (${med.frequency || 'N/A'})`, 70);
                    });
                    
                    doc.moveDown(0.5);
                }

                // Chronic Conditions
                if (medicalInfo.chronic_conditions && medicalInfo.chronic_conditions.length > 0) {
                    doc.fontSize(11)
                       .fillColor('#1f2937')
                       .text('Chronic Conditions:', 60, doc.y, { underline: true });
                    
                    doc.fontSize(9)
                       .fillColor('#4b5563');
                    
                    medicalInfo.chronic_conditions.slice(0, 8).forEach((condition, index) => {
                        doc.text(`${index + 1}. ${condition.condition_name || 'N/A'}`, 70);
                    });
                    
                    doc.moveDown(0.5);
                }

                // Blood Glucose Data
                if (medicalInfo.blood_glucose_data) {
                    doc.fontSize(11)
                       .fillColor('#1f2937')
                       .text('Blood Glucose Readings:', 60, doc.y, { underline: true });
                    
                    doc.fontSize(10)
                       .fillColor('#4b5563');
                    
                    const bgData = medicalInfo.blood_glucose_data;
                    if (bgData.fasting_glucose) doc.text(`Fasting Glucose: ${bgData.fasting_glucose} mg/dL`, 70);
                    if (bgData.hba1c) doc.text(`HbA1c: ${bgData.hba1c}%`, 70);
                    if (bgData.postprandial_glucose) doc.text(`Postprandial: ${bgData.postprandial_glucose} mg/dL`, 70);
                    
                    doc.moveDown(0.5);
                }

                doc.moveDown(0.5);
            }

            // Recommendations Section
            if (doc.y > 650) {
                doc.addPage();
            }

            doc.fontSize(13)
               .fillColor('#374151')
               .text('Clinical Recommendations', { underline: true });
            
            doc.moveDown(0.5);

            // Risk-specific recommendations
            let recommendations = [];
            
            if (riskLevel.toLowerCase() === 'high') {
                recommendations = [
                    'Immediate consultation with an endocrinologist or diabetes specialist is recommended',
                    'Regular blood glucose monitoring (at least twice daily)',
                    'Follow prescribed medication regimen strictly',
                    'Adopt a structured meal plan with controlled carbohydrate intake',
                    'Engage in moderate physical activity for at least 30 minutes, 5 days a week',
                    'Schedule regular follow-up appointments every 3 months',
                    'Consider diabetes education program enrollment',
                    'Monitor for complications: foot care, eye exams, kidney function tests'
                ];
            } else if (riskLevel.toLowerCase() === 'medium') {
                recommendations = [
                    'Schedule a consultation with your primary care physician',
                    'Monitor blood glucose levels regularly as advised by your doctor',
                    'Implement dietary modifications focusing on low glycemic index foods',
                    'Incorporate 30 minutes of moderate exercise most days of the week',
                    'Maintain a healthy weight through balanced nutrition and activity',
                    'Schedule follow-up assessments every 6 months',
                    'Track your symptoms and lifestyle factors regularly',
                    'Learn about diabetes prevention strategies'
                ];
            } else {
                recommendations = [
                    'Continue maintaining a healthy lifestyle',
                    'Periodic health check-ups as part of routine care',
                    'Balanced diet rich in vegetables, whole grains, and lean proteins',
                    'Regular physical activity (at least 150 minutes per week)',
                    'Maintain healthy body weight',
                    'Annual screening for diabetes risk factors',
                    'Stay informed about diabetes prevention',
                    'Monitor for any new symptoms and report to your healthcare provider'
                ];
            }

            doc.fontSize(10)
               .fillColor('#1f2937');
            
            recommendations.forEach((rec, index) => {
                if (doc.y > 720) {
                    doc.addPage();
                }
                doc.text(`${index + 1}. ${rec}`, 60, doc.y, { width: 475, align: 'justify' });
                doc.moveDown(0.3);
            });

            doc.moveDown(1);

            // Important Notice
            if (doc.y > 680) {
                doc.addPage();
            }

            doc.roundedRect(50, doc.y, 495, 60, 3)
               .fillAndStroke('#fef3c7', '#f59e0b');
            
            doc.fontSize(10)
               .fillColor('#92400e')
               .text('⚠️ Important Notice', 60, doc.y + 10, { underline: true, width: 475 });
            
            doc.fontSize(8)
               .fillColor('#78350f')
               .text('This assessment is a screening tool and does not constitute a medical diagnosis. Please consult with a qualified healthcare professional for proper medical advice, diagnosis, and treatment. This report should be shared with your doctor during your consultation.', 60, doc.y + 25, { width: 475, align: 'justify' });
            
            doc.y += 60;

            // Footer
            doc.fontSize(7)
               .fillColor('#9ca3af')
               .text(`Report Generated: ${new Date().toLocaleString('en-US')}`, 50, 770, { align: 'center', width: 495 })
               .text('Diabetes Symptom Collector - Your Health Management Partner', { align: 'center', width: 495 });

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Cleanup temporary PDF file
 * @param {string} filePath - Path to file to delete
 * @param {number} delay - Delay in milliseconds before deletion (default: 5000ms)
 */
const cleanupTemporaryFile = (filePath, delay = 5000) => {
    setTimeout(() => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Temporary PDF file cleaned up: ${filePath}`);
            }
        } catch (error) {
            console.error('Error cleaning up temporary file:', error);
        }
    }, delay);
};

export {
    generateDietPlanPDF,
    generateExercisePlanPDF,
    generateLifestyleTipsPDF,
    generateRiskAssessmentPDF,
    cleanupTemporaryFile
};
