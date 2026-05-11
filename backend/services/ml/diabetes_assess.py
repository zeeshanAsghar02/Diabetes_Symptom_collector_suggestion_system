import sys, json, os
from pathlib import Path

# Debug information
print(f"Python script started", file=sys.stderr)
print(f"PROJECT_ROOT env var: {os.getenv('PROJECT_ROOT')}", file=sys.stderr)
print(f"Current working directory: {os.getcwd()}", file=sys.stderr)

PROJECT_ROOT = os.getenv('PROJECT_ROOT')
if PROJECT_ROOT:
    model_path = str(Path(PROJECT_ROOT) / 'DiabetesModel')
    sys.path.append(model_path)
    print(f"Added to Python path: {model_path}", file=sys.stderr)
else:
    # Fallback: try to find the model directory relative to current script
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent
    model_path = str(project_root / 'DiabetesModel')
    sys.path.append(model_path)
    PROJECT_ROOT = str(project_root)
    print(f"Using fallback path: {model_path}", file=sys.stderr)

# Try multiple import methods
DiabetesRiskAssessmentSystem = None
import_success = False

# Method 1: Direct import
try:
    from EnhancedDiabetesSystem import DiabetesRiskAssessmentSystem
    print("Successfully imported EnhancedDiabetesSystem (method 1)", file=sys.stderr)
    import_success = True
except Exception as e:
    print(f"Import method 1 failed: {str(e)}", file=sys.stderr)

# Method 2: Import the module first, then get the class
if not import_success:
    try:
        import EnhancedDiabetesSystem
        DiabetesRiskAssessmentSystem = EnhancedDiabetesSystem.DiabetesRiskAssessmentSystem
        print("Successfully imported EnhancedDiabetesSystem (method 2)", file=sys.stderr)
        import_success = True
    except Exception as e:
        print(f"Import method 2 failed: {str(e)}", file=sys.stderr)

# Method 3: Try importing from the full path
if not import_success:
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("EnhancedDiabetesSystem", 
                                                    str(Path(PROJECT_ROOT) / 'DiabetesModel' / 'EnhancedDiabetesSystem.py'))
        EnhancedDiabetesSystem_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(EnhancedDiabetesSystem_module)
        DiabetesRiskAssessmentSystem = EnhancedDiabetesSystem_module.DiabetesRiskAssessmentSystem
        print("Successfully imported EnhancedDiabetesSystem (method 3)", file=sys.stderr)
        import_success = True
    except Exception as e:
        print(f"Import method 3 failed: {str(e)}", file=sys.stderr)

if not import_success or DiabetesRiskAssessmentSystem is None:
    print(f"All import methods failed", file=sys.stderr)
    print(f"Python path: {sys.path}", file=sys.stderr)
    print(f"Files in model directory: {list(Path(PROJECT_ROOT, 'DiabetesModel').glob('*.py'))}", file=sys.stderr)
    print(json.dumps({"error": "Failed to import EnhancedDiabetesSystem module"}))
    sys.exit(1)

def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw else {}
        features = payload.get('features', {})
        
        print(f"Received features: {features}", file=sys.stderr)

        # Load model from DiabetesModel directory
        model_path = str(Path(PROJECT_ROOT or '.') / 'DiabetesModel' / 'diabetes_xgb_model.pkl')
        print(f"Model path: {model_path}", file=sys.stderr)
        
        # Check if model file exists
        if not os.path.exists(model_path):
            error_msg = f"Model file not found at: {model_path}"
            print(error_msg, file=sys.stderr)
            print(json.dumps({"error": error_msg}))
            sys.exit(1)
        
        print("Loading model...", file=sys.stderr)
        system = DiabetesRiskAssessmentSystem(model_path=model_path)
        print("Model loaded successfully", file=sys.stderr)
        
        print("Running prediction...", file=sys.stderr)
        result = system.predict_risk_with_confidence(features)
        print("Prediction completed", file=sys.stderr)
        
        print(json.dumps(result))
    except Exception as e:
        error_msg = f"Assessment failed: {str(e)}"
        print(error_msg, file=sys.stderr)
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
        print(json.dumps({"error": error_msg}))
        sys.exit(1)

if __name__ == '__main__':
    main()





