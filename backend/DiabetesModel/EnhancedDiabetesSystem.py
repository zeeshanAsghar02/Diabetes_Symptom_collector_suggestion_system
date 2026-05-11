import pandas as pd
import joblib
import numpy as np
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
import warnings
import json
from datetime import datetime
import sys
warnings.filterwarnings('ignore')

class DiabetesRiskAssessmentSystem:
    """
    Enhanced Diabetes Risk Assessment System with Risk Stratification,
    Personalized Recommendations, and Model Interpretability
    """
    
    def __init__(self, model_path="diabetes_xgb_model.pkl"):
        """Initialize the diabetes risk assessment system"""
        self.model = joblib.load(model_path)
        self.risk_thresholds = {
            'low': 0.3,
            'moderate': 0.7,
            'high': 0.9
        }
        
        # Symptom explanations for educational purposes
        self.symptom_explanations = {
            'Polyuria': 'Frequent urination - one of the most common early signs of diabetes',
            'Polydipsia': 'Excessive thirst - caused by dehydration from frequent urination',
            'sudden weight loss': 'Unexplained weight loss despite normal or increased appetite',
            'weakness': 'General fatigue and weakness, often due to cells not getting enough glucose',
            'Polyphagia': 'Increased appetite - body trying to compensate for lost glucose',
            'Genital thrush': 'Yeast infections that occur more frequently in people with diabetes',
            'visual blurring': 'Blurred vision caused by high blood sugar affecting the eyes',
            'Itching': 'Persistent itching, especially around genitals, due to yeast infections',
            'Irritability': 'Mood changes and irritability due to blood sugar fluctuations',
            'delayed healing': 'Slow healing of cuts and wounds due to poor circulation',
            'partial paresis': 'Muscle weakness or partial paralysis',
            'muscle stiffness': 'Stiffness and muscle cramps, often in legs',
            'Alopecia': 'Hair loss or thinning hair',
            'Obesity': 'Excess body weight, a major risk factor for Type 2 diabetes'
        }
        
        # Personalized recommendations based on risk level and symptoms
        self.recommendations = {
            'low': {
                'general': [
                    "Continue maintaining a healthy lifestyle",
                    "Get regular check-ups annually",
                    "Monitor your symptoms and report any changes to your doctor"
                ],
                'specific': {
                    'Obesity': "Consider maintaining a healthy weight through diet and exercise",
                    'Age': "As you age, diabetes risk increases - stay vigilant about symptoms"
                }
            },
            'moderate': {
                'general': [
                    "Schedule a comprehensive health check-up within 2-4 weeks",
                    "Consider getting blood glucose and HbA1c tests",
                    "Start monitoring your blood sugar levels if recommended by your doctor",
                    "Focus on lifestyle modifications: diet and exercise"
                ],
                'specific': {
                    'Polyuria': "Monitor your fluid intake and urination frequency",
                    'Polydipsia': "Stay hydrated but avoid sugary drinks",
                    'sudden weight loss': "Track your weight and consult a doctor about unexplained weight loss",
                    'visual blurring': "Schedule an eye exam to rule out diabetes-related vision problems"
                }
            },
            'high': {
                'general': [
                    "URGENT: Schedule a doctor's appointment within 1-2 weeks",
                    "Get comprehensive blood tests including fasting glucose and HbA1c",
                    "Start monitoring blood sugar levels daily",
                    "Consider consulting an endocrinologist",
                    "Implement immediate lifestyle changes"
                ],
                'specific': {
                    'Polyuria': "This is a strong indicator - seek medical attention promptly",
                    'Polydipsia': "Excessive thirst with other symptoms requires immediate evaluation",
                    'sudden weight loss': "Unexplained weight loss with other symptoms is concerning",
                    'visual blurring': "Diabetes can cause serious eye problems - see an ophthalmologist"
                }
            },
            'critical': {
                'general': [
                    "EMERGENCY: Seek medical attention immediately",
                    "Go to urgent care or emergency room if symptoms are severe",
                    "Contact your doctor today for immediate evaluation",
                    "Do not delay - early intervention is crucial"
                ],
                'specific': {
                    'Polyuria': "Severe frequent urination requires immediate medical attention",
                    'Polydipsia': "Extreme thirst with other symptoms may indicate diabetic ketoacidosis",
                    'visual blurring': "Sudden vision changes require immediate ophthalmologic evaluation"
                }
            }
        }
    
    def predict_risk_with_confidence(self, symptoms_data):
        """
        Predict diabetes risk with confidence scores and uncertainty measures
        
        Args:
            symptoms_data: Dictionary of symptoms and their values
            
        Returns:
            Dictionary with risk prediction, confidence, and explanations
        """
        try:
            # Convert symptoms to model input format
            feature_vector = self._prepare_features(symptoms_data)
            
            # Get prediction probabilities
            probabilities = self.model.predict_proba(feature_vector)[0]
            diabetes_probability = probabilities[1]  # Probability of diabetes
            
            # Determine risk level
            risk_level = self._determine_risk_level(diabetes_probability)
            
            # Calculate confidence based on probability distribution
            confidence = self._calculate_confidence(probabilities)
            
            # Get feature importance for interpretability
            feature_importance = self._get_feature_importance(feature_vector)
            
            # Generate personalized recommendations
            recommendations = self._generate_recommendations(risk_level, symptoms_data, feature_importance)
            
            # Prepare educational content
            educational_content = self._prepare_educational_content(symptoms_data)
            
            result = {
                'risk_level': risk_level,
                'diabetes_probability': float(round(diabetes_probability, 3)),
                'confidence': float(round(confidence, 3)),
                'prediction': 'High Risk' if diabetes_probability > 0.5 else 'Low Risk',
                'feature_importance': feature_importance,
                'recommendations': recommendations,
                'educational_content': educational_content,
                'timestamp': datetime.now().isoformat(),
                'assessment_summary': self._generate_assessment_summary(risk_level, diabetes_probability, confidence)
            }
            
            return result
            
        except Exception as e:
            return {
                'error': f"Assessment failed: {str(e)}",
                'risk_level': 'unknown',
                'diabetes_probability': 0.0,
                'confidence': 0.0
            }
    
    def _prepare_features(self, symptoms_data):
        """Convert symptoms data to model input format"""
        # Expected features from training
        expected_features = [
            'Age', 'Gender', 'Polyuria', 'Polydipsia', 'sudden weight loss', 
            'weakness', 'Polyphagia', 'Genital thrush', 'visual blurring', 
            'Itching', 'Irritability', 'delayed healing', 'partial paresis', 
            'muscle stiffness', 'Alopecia', 'Obesity'
        ]
        
        feature_vector = []
        for feature in expected_features:
            if feature in symptoms_data:
                value = symptoms_data[feature]
                # Convert to numeric if needed
                if isinstance(value, str):
                    if value.lower() in ['yes', 'true', '1']:
                        feature_vector.append(1)
                    elif value.lower() in ['no', 'false', '0']:
                        feature_vector.append(0)
                    else:
                        feature_vector.append(0)  # Default to 0 for unknown
                else:
                    feature_vector.append(float(value))
            else:
                feature_vector.append(0)  # Default value for missing features
        
        return np.array(feature_vector).reshape(1, -1)
    
    def _determine_risk_level(self, probability):
        """Determine risk level based on probability"""
        if probability >= self.risk_thresholds['high']:
            return 'critical'
        elif probability >= self.risk_thresholds['moderate']:
            return 'high'
        elif probability >= self.risk_thresholds['low']:
            return 'moderate'
        else:
            return 'low'
    
    def _calculate_confidence(self, probabilities):
        """Calculate confidence based on probability distribution"""
        # Higher confidence when probabilities are more extreme (closer to 0 or 1)
        max_prob = np.max(probabilities)
        confidence = 2 * abs(max_prob - 0.5)  # Scale to 0-1 range
        return min(confidence, 1.0)
    
    def _get_feature_importance(self, feature_vector):
        """Get feature importance for interpretability"""
        try:
            # Get feature names
            feature_names = [
                'Age', 'Gender', 'Polyuria', 'Polydipsia', 'sudden weight loss', 
                'weakness', 'Polyphagia', 'Genital thrush', 'visual blurring', 
                'Itching', 'Irritability', 'delayed healing', 'partial paresis', 
                'muscle stiffness', 'Alopecia', 'Obesity'
            ]
            
            # Get SHAP-like feature importance (simplified version)
            # In a real implementation, you'd use actual SHAP values
            feature_values = feature_vector[0]
            
            # Create importance scores based on feature values and model weights
            importance_scores = {}
            for i, (name, value) in enumerate(zip(feature_names, feature_values)):
                if value > 0:  # Only show importance for present symptoms
                    # Simplified importance calculation
                    importance_scores[name] = {
                        'value': value,
                        'importance': abs(value) * (0.1 + i * 0.05),  # Mock importance
                        'contribution': 'positive' if value > 0 else 'negative'
                    }
            
            # Sort by importance
            sorted_importance = dict(sorted(
                importance_scores.items(), 
                key=lambda x: x[1]['importance'], 
                reverse=True
            ))
            
            return sorted_importance
            
        except Exception as e:
            return {'error': f"Could not calculate feature importance: {str(e)}"}
    
    def _generate_recommendations(self, risk_level, symptoms_data, feature_importance):
        """Generate personalized recommendations based on risk level and symptoms"""
        recommendations = {
            'risk_level': risk_level,
            'general_recommendations': self.recommendations[risk_level]['general'],
            'symptom_specific': [],
            'next_steps': [],
            'timeline': self._get_recommendation_timeline(risk_level)
        }
        
        # Add symptom-specific recommendations
        for symptom, data in feature_importance.items():
            if symptom in self.recommendations[risk_level]['specific']:
                recommendations['symptom_specific'].append({
                    'symptom': symptom,
                    'recommendation': self.recommendations[risk_level]['specific'][symptom],
                    'explanation': self.symptom_explanations.get(symptom, '')
                })
        
        # Add next steps based on risk level
        recommendations['next_steps'] = self._get_next_steps(risk_level)
        
        return recommendations
    
    def _get_recommendation_timeline(self, risk_level):
        """Get recommended timeline for actions based on risk level"""
        timelines = {
            'low': "Continue monitoring - annual check-ups recommended",
            'moderate': "Schedule appointment within 2-4 weeks",
            'high': "Schedule appointment within 1-2 weeks",
            'critical': "Seek medical attention immediately (within 24-48 hours)"
        }
        return timelines.get(risk_level, "Consult your healthcare provider")
    
    def _get_next_steps(self, risk_level):
        """Get specific next steps based on risk level"""
        steps = {
            'low': [
                "Continue healthy lifestyle habits",
                "Monitor for new symptoms",
                "Annual health check-up"
            ],
            'moderate': [
                "Schedule comprehensive health check-up",
                "Request blood glucose and HbA1c tests",
                "Start symptom tracking diary"
            ],
            'high': [
                "Schedule urgent doctor appointment",
                "Get comprehensive blood work",
                "Consider endocrinologist consultation",
                "Start blood sugar monitoring"
            ],
            'critical': [
                "Seek immediate medical attention",
                "Go to urgent care or emergency room if severe",
                "Contact doctor today",
                "Prepare for immediate testing"
            ]
        }
        return steps.get(risk_level, ["Consult your healthcare provider"])
    
    def _prepare_educational_content(self, symptoms_data):
        """Prepare educational content about diabetes and symptoms"""
        educational = {
            'about_diabetes': "Diabetes is a chronic condition that affects how your body processes blood sugar (glucose).",
            'symptom_explanations': {},
            'prevention_tips': [
                "Maintain a healthy weight",
                "Exercise regularly (at least 150 minutes per week)",
                "Eat a balanced diet with limited sugar and processed foods",
                "Get regular health check-ups",
                "Monitor your blood pressure and cholesterol"
            ],
            'when_to_seek_help': "Seek immediate medical attention if you experience severe symptoms like extreme thirst, frequent urination, unexplained weight loss, or vision changes."
        }
        
        # Add explanations for present symptoms
        for symptom in symptoms_data:
            if symptom in self.symptom_explanations:
                educational['symptom_explanations'][symptom] = self.symptom_explanations[symptom]
        
        return educational
    
    def _generate_assessment_summary(self, risk_level, probability, confidence):
        """Generate a comprehensive assessment summary"""
        risk_descriptions = {
            'low': "Low risk of diabetes",
            'moderate': "Moderate risk of diabetes",
            'high': "High risk of diabetes",
            'critical': "Critical risk - immediate attention needed"
        }
        
        confidence_descriptions = {
            'high': "high confidence",
            'medium': "moderate confidence",
            'low': "low confidence"
        }
        
        conf_level = 'high' if confidence > 0.8 else 'medium' if confidence > 0.6 else 'low'
        
        summary = f"""
        Assessment Summary:
        • Risk Level: {risk_descriptions[risk_level]}
        • Probability: {probability:.1%}
        • Confidence: {confidence_descriptions[conf_level]} ({confidence:.1%})
        • Recommendation: {self._get_recommendation_timeline(risk_level)}
        """
        
        return summary.strip()

    def predict_risk_with_llm_ensemble(self, symptoms_data, llm_base_url='http://127.0.0.1:1234', llm_model='diabetica-7b'):
        """
        Enhanced prediction using ensemble approach: XGBoost + LLM validation
        This method is designed to work with external LLM calling (from Node.js)
        Returns predictions optimized for LLM enhancement
        
        Args:
            symptoms_data: Dictionary of symptoms and their values
            llm_base_url: Base URL for LM Studio (optional, for future direct Python-LLM integration)
            llm_model: Model name (optional, for future direct Python-LLM integration)
            
        Returns:
            Dictionary with enhanced predictions ready for LLM processing
        """
        try:
            # Get base XGBoost prediction
            base_result = self.predict_risk_with_confidence(symptoms_data)
            
            # Enhance result with structured data for LLM processing
            llm_ready_result = {
                **base_result,
                'llm_enhancement_ready': True,
                'symptom_summary': self._create_symptom_summary(symptoms_data),
                'clinical_context': self._create_clinical_context(symptoms_data, base_result),
                'enhancement_metadata': {
                    'model_type': 'XGBoost',
                    'requires_llm_validation': base_result['confidence'] < 0.8,
                    'symptom_count': sum(1 for k, v in symptoms_data.items() 
                                       if k not in ['Age', 'Gender'] and v == 1),
                    'classic_triad_present': self._check_classic_triad(symptoms_data)
                }
            }
            
            return llm_ready_result
            
        except Exception as e:
            return {
                'error': f"LLM-ready assessment failed: {str(e)}",
                'risk_level': 'unknown',
                'diabetes_probability': 0.0,
                'confidence': 0.0,
                'llm_enhancement_ready': False
            }
    
    def _create_symptom_summary(self, symptoms_data):
        """Create a human-readable symptom summary for LLM processing"""
        present_symptoms = []
        absent_symptoms = []
        
        symptom_names = {
            'Polyuria': 'Frequent urination',
            'Polydipsia': 'Excessive thirst',
            'sudden weight loss': 'Sudden weight loss',
            'weakness': 'Weakness/fatigue',
            'Polyphagia': 'Excessive hunger',
            'Genital thrush': 'Genital yeast infections',
            'visual blurring': 'Blurred vision',
            'Itching': 'Itching',
            'Irritability': 'Irritability',
            'delayed healing': 'Delayed wound healing',
            'partial paresis': 'Muscle weakness',
            'muscle stiffness': 'Muscle stiffness',
            'Alopecia': 'Hair loss',
            'Obesity': 'Obesity'
        }
        
        for key, value in symptoms_data.items():
            if key in ['Age', 'Gender']:
                continue
            display_name = symptom_names.get(key, key)
            if value == 1:
                present_symptoms.append(display_name)
            else:
                absent_symptoms.append(display_name)
        
        return {
            'present': present_symptoms,
            'absent': absent_symptoms,
            'total_present': len(present_symptoms),
            'age': symptoms_data.get('Age', 'unknown'),
            'gender': 'Male' if symptoms_data.get('Gender') == 1 else 'Female' if symptoms_data.get('Gender') == 0 else 'unknown'
        }
    
    def _create_clinical_context(self, symptoms_data, base_result):
        """Create clinical context for LLM reasoning"""
        context = {
            'patient_profile': {
                'age': symptoms_data.get('Age', 'unknown'),
                'gender': 'Male' if symptoms_data.get('Gender') == 1 else 'Female',
                'obesity_status': 'Yes' if symptoms_data.get('Obesity') == 1 else 'No'
            },
            'symptom_patterns': {
                'classic_triad': self._check_classic_triad(symptoms_data),
                'metabolic_symptoms': self._check_metabolic_symptoms(symptoms_data),
                'complication_signs': self._check_complication_signs(symptoms_data)
            },
            'risk_indicators': {
                'high_priority_symptoms': self._identify_high_priority_symptoms(symptoms_data),
                'red_flags': self._identify_red_flags(symptoms_data, base_result)
            }
        }
        
        return context
    
    def _check_classic_triad(self, symptoms_data):
        """Check for classic diabetes triad: Polyuria, Polydipsia, Polyphagia"""
        triad = {
            'polyuria': symptoms_data.get('Polyuria', 0) == 1,
            'polydipsia': symptoms_data.get('Polydipsia', 0) == 1,
            'polyphagia': symptoms_data.get('Polyphagia', 0) == 1
        }
        triad['present'] = sum(triad.values())
        triad['complete'] = triad['present'] == 3
        return triad
    
    def _check_metabolic_symptoms(self, symptoms_data):
        """Check for metabolic symptoms"""
        return {
            'weight_loss': symptoms_data.get('sudden weight loss', 0) == 1,
            'weakness': symptoms_data.get('weakness', 0) == 1,
            'obesity': symptoms_data.get('Obesity', 0) == 1,
            'present_count': sum([
                symptoms_data.get('sudden weight loss', 0) == 1,
                symptoms_data.get('weakness', 0) == 1,
                symptoms_data.get('Obesity', 0) == 1
            ])
        }
    
    def _check_complication_signs(self, symptoms_data):
        """Check for signs of complications"""
        return {
            'vision_problems': symptoms_data.get('visual blurring', 0) == 1,
            'delayed_healing': symptoms_data.get('delayed healing', 0) == 1,
            'neuropathy_signs': symptoms_data.get('partial paresis', 0) == 1 or symptoms_data.get('muscle stiffness', 0) == 1,
            'infections': symptoms_data.get('Genital thrush', 0) == 1 or symptoms_data.get('Itching', 0) == 1,
            'present_count': sum([
                symptoms_data.get('visual blurring', 0) == 1,
                symptoms_data.get('delayed healing', 0) == 1,
                symptoms_data.get('partial paresis', 0) == 1,
                symptoms_data.get('muscle stiffness', 0) == 1,
                symptoms_data.get('Genital thrush', 0) == 1,
                symptoms_data.get('Itching', 0) == 1
            ])
        }
    
    def _identify_high_priority_symptoms(self, symptoms_data):
        """Identify high-priority symptoms that warrant immediate attention"""
        high_priority = []
        
        priority_symptoms = {
            'Polyuria': 'Classic diabetes symptom - requires evaluation',
            'Polydipsia': 'Classic diabetes symptom - requires evaluation',
            'sudden weight loss': 'Concerning symptom - may indicate uncontrolled diabetes',
            'visual blurring': 'Potential diabetes complication - needs ophthalmologic evaluation',
            'delayed healing': 'Sign of poor glycemic control or complications'
        }
        
        for symptom, explanation in priority_symptoms.items():
            if symptoms_data.get(symptom, 0) == 1:
                high_priority.append({
                    'symptom': symptom,
                    'reason': explanation
                })
        
        return high_priority
    
    def _identify_red_flags(self, symptoms_data, base_result):
        """Identify red flags requiring immediate medical attention"""
        red_flags = []
        
        # Check for severe symptom combinations
        if (symptoms_data.get('Polyuria', 0) == 1 and 
            symptoms_data.get('Polydipsia', 0) == 1 and 
            symptoms_data.get('sudden weight loss', 0) == 1):
            red_flags.append('Complete classic triad present - suggests significant hyperglycemia')
        
        if base_result['diabetes_probability'] > 0.8 and base_result['confidence'] > 0.7:
            red_flags.append('Very high probability with good confidence - immediate evaluation recommended')
        
        if symptoms_data.get('visual blurring', 0) == 1 and base_result['diabetes_probability'] > 0.6:
            red_flags.append('Vision changes with elevated diabetes risk - urgent ophthalmologic evaluation needed')
        
        # Check age and multiple symptoms
        age = symptoms_data.get('Age', 0)
        symptom_count = sum(1 for k, v in symptoms_data.items() 
                          if k not in ['Age', 'Gender'] and v == 1)
        if age > 40 and symptom_count >= 6:
            red_flags.append('Multiple symptoms in middle-aged/older patient - comprehensive evaluation warranted')
        
        return red_flags

# Example usage and testing
def test_enhanced_system():
    """Test the enhanced diabetes risk assessment system"""
    
    # Initialize the system
    system = DiabetesRiskAssessmentSystem()
    
    # Test case 1: High risk patient
    high_risk_symptoms = {
        'Age': 45,
        'Gender': 1,  # Male
        'Polyuria': 1,  # Yes
        'Polydipsia': 1,  # Yes
        'sudden weight loss': 1,  # Yes
        'weakness': 1,  # Yes
        'Polyphagia': 1,  # Yes
        'visual blurring': 1,  # Yes
        'Obesity': 1,  # Yes
        'delayed healing': 1,  # Yes
        'Itching': 1,  # Yes
        'Irritability': 1,  # Yes
        'Genital thrush': 0,  # No
        'partial paresis': 0,  # No
        'muscle stiffness': 0,  # No
        'Alopecia': 0  # No
    }
    
    print("="*60)
    print("ENHANCED DIABETES RISK ASSESSMENT SYSTEM")
    print("="*60)
    
    # Get assessment
    result = system.predict_risk_with_confidence(high_risk_symptoms)
    
    print(f"\n🔍 RISK ASSESSMENT RESULTS:")
    print(f"Risk Level: {result['risk_level'].upper()}")
    print(f"Diabetes Probability: {result['diabetes_probability']:.1%}")
    print(f"Confidence: {result['confidence']:.1%}")
    print(f"Prediction: {result['prediction']}")
    
    print(f"\n📊 ASSESSMENT SUMMARY:")
    print(result['assessment_summary'])
    
    print(f"\n🎯 PERSONALIZED RECOMMENDATIONS:")
    print(f"Risk Level: {result['recommendations']['risk_level'].upper()}")
    print(f"Timeline: {result['recommendations']['timeline']}")
    
    print(f"\nGeneral Recommendations:")
    for i, rec in enumerate(result['recommendations']['general_recommendations'], 1):
        print(f"  {i}. {rec}")
    
    print(f"\nNext Steps:")
    for i, step in enumerate(result['recommendations']['next_steps'], 1):
        print(f"  {i}. {step}")
    
    print(f"\n🔬 SYMPTOM ANALYSIS:")
    if 'feature_importance' in result and not isinstance(result['feature_importance'], dict):
        for symptom, data in result['feature_importance'].items():
            if isinstance(data, dict) and 'importance' in data:
                print(f"  • {symptom}: {data['importance']:.2f} importance")
    
    print(f"\n📚 EDUCATIONAL CONTENT:")
    print(f"About Diabetes: {result['educational_content']['about_diabetes']}")
    
    print(f"\nPrevention Tips:")
    for i, tip in enumerate(result['educational_content']['prevention_tips'], 1):
        print(f"  {i}. {tip}")
    
    print(f"\nWhen to Seek Help: {result['educational_content']['when_to_seek_help']}")
    
    return result

if __name__ == "__main__":
    # Run the test
    test_result = test_enhanced_system()
    
    # Save results to file for further analysis
    with open('enhanced_assessment_result.json', 'w') as f:
        json.dump(test_result, f, indent=2)
    
    print(f"\n💾 Results saved to 'enhanced_assessment_result.json'")
    print("="*60)
