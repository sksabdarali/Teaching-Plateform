const { spawn } = require('child_process');
const path = require('path');

console.log('Starting AI-Powered Teaching Platform...');
console.log('=====================================');

// Start backend server
console.log('Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  shell: true
});

backend.stdout.on('data', (data) => {
  console.log(`Backend: ${data}`);
});

backend.stderr.on('data', (data) => {
  console.error(`Backend Error: ${data}`);
});

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

// Start frontend server after a short delay
setTimeout(() => {
  console.log('Starting frontend server...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    shell: true
  });

  frontend.stdout.on('data', (data) => {
    console.log(`Frontend: ${data}`);
  });

  frontend.stderr.on('data', (data) => {
    console.error(`Frontend Error: ${data}`);
  });

  frontend.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
  });

  // Keep the script running
  process.stdin.resume();
}, 2000); // 2 second delay to let backend start first