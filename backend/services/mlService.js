import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Runs the Python risk assessment script with provided feature payload
export function assessDiabetesRiskPython(features) {
  return new Promise((resolve, reject) => {
    // Resolve paths from this file location instead of process cwd for runtime safety.
    const projectRoot = path.resolve(__dirname, '..');
    const scriptPath = path.resolve(__dirname, 'ml', 'diabetes_assess.py');

    console.log('Project root:', projectRoot);
    console.log('Script path:', scriptPath);
    console.log('Current working directory:', process.cwd());

    const pythonCmd = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');

    const child = spawn(pythonCmd, [scriptPath], {
      cwd: projectRoot,
      env: {
        ...process.env,
        PROJECT_ROOT: projectRoot,
        PYTHONUNBUFFERED: '1'
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




