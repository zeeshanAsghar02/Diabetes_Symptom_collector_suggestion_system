import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    question_text: { type: String, required: true },
    category: { type: String },
    symptom_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Symptom",
        required: true,
    },
    question_type: {
        type: String,
        enum: [
            'radio', 'checkbox', 'number', 'text', 'dropdown', 'textarea', 'date', 'file', 'email', 'password', 'range', 'time', 'datetime-local', 'color', 'tel', 'url'
        ],
        required: true,
    },
    options: [{ type: String }], // Only for radio, checkbox, dropdown
    
    // ML Model Integration Configuration
    ml_feature_mapping: {
        feature_name: { type: String }, // e.g., 'Polyuria', 'Gender', 'Age'
        value_mapping: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
            // e.g., Map { 'Yes' => 1, 'No' => 0, 'Sometimes' => 0.5 }
        },
        is_required: { type: Boolean, default: false },
        transformation: { 
            type: String,
            enum: ['none', 'extract_number', 'extract_first_number', 'yes_no_binary', 'calculate_bmi_input', 'unit_conversion']
        }, // How to process the answer before mapping
        default_value: { type: mongoose.Schema.Types.Mixed, default: 0 } // Default if no answer
    },
    
    // Special Rendering Configuration (for unit conversions, compound fields, etc.)
    render_config: {
        type: { 
            type: String,
            enum: ['default', 'unit_conversion', 'compound', 'slider_with_labels']
        },
        config: { type: mongoose.Schema.Types.Mixed }
        // Examples:
        // unit_conversion: { from_units: ['feet', 'inches'], to_unit: 'cm', formula: '(feet * 30.48) + (inches * 2.54)' }
        // compound: { fields: [{ name: 'systolic', type: 'number' }, { name: 'diastolic', type: 'number' }] }
        // slider_with_labels: { min: 0, max: 10, labels: { 0: 'Never', 5: 'Sometimes', 10: 'Always' } }
    },
    
    deleted_at: { type: Date, default: null },
}, { timestamps: true });

export const Question = mongoose.model("Question", questionSchema); 