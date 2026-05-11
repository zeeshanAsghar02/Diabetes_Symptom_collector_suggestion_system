import { spawn } from 'child_process';
import path from 'path';

// Runs the Python risk assessment script with provided feature payload
export function assessDiabetesRiskPython(features) {
  return new Promise((resolve, reject) => {
    // DiabetesModel is in the backend directory
    const projectRoot = path.resolve(process.cwd());
    const scriptPath = path.resolve(process.cwd(), 'services', 'ml', 'diabetes_assess.py');

    console.log('Project root:', projectRoot);
    console.log('Script path:', scriptPath);
    console.log('Current working directory:', process.cwd());

    const pythonCmd = process.env.PYTHON_BIN || 'python3';

    const child = spawn(pythonCmd, [scriptPath], {
      cwd: path.resolve(process.cwd()),
      env: {
        ...process.env,
        PROJECT_ROOT: projectRoot,
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => reject(err));

    child.on('close', (code) => {
      console.log('Python process exited with code:', code);
      console.log('Python stdout:', stdout);
      console.log('Python stderr:', stderr);
      
      if (code !== 0) {
        const errorMsg = `Python exited with code ${code}`;
        console.error('Python error:', errorMsg);
        console.error('Stderr:', stderr);
        return reject(new Error(`${errorMsg}: ${stderr}`));
      }
      
      if (!stdout.trim()) {
        return reject(new Error('Python script returned empty output'));
      }
      
      try {
        const parsed = JSON.parse(stdout);
        console.log('Parsed Python result:', parsed);
        resolve(parsed);
      } catch (e) {
        console.error('Failed to parse Python output:', e.message);
        console.error('Raw stdout:', stdout);
        reject(new Error(`Failed to parse Python output: ${e.message}. Raw: ${stdout}`));
      }
    });

    // Write JSON payload to stdin
    child.stdin.write(JSON.stringify({ features }));
    child.stdin.end();
  });
}




