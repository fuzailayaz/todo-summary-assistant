const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Vercel build process...');

// Install dependencies
console.log('📦 Installing dependencies...');
console.log('- Installing server dependencies...');
execSync('npm install --prefix server', { stdio: 'inherit' });
console.log('- Installing client dependencies...');
execSync('npm install --prefix client', { stdio: 'inherit' });

// Build client
console.log('🔨 Building client...');
execSync('npm run build --prefix client', { stdio: 'inherit' });

// Copy server files to the .vercel/output directory
console.log('📂 Copying server files...');
const vercelOutputDir = path.join(process.cwd(), '.vercel', 'output');
const staticDir = path.join(vercelOutputDir, 'static');
const functionsDir = path.join(vercelOutputDir, 'functions');

// Create necessary directories
if (!fs.existsSync(vercelOutputDir)) {
  fs.mkdirSync(vercelOutputDir, { recursive: true });
}
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
}

// Copy client build to static directory
const clientBuildDir = path.join(process.cwd(), 'client', 'build');
if (fs.existsSync(clientBuildDir)) {
  console.log(`📁 Copying client build from ${clientBuildDir} to ${staticDir}`);
  fs.cpSync(clientBuildDir, staticDir, { recursive: true });
}

// Copy server files to functions directory
const serverFiles = [
  'server/server.js',
  'server/package.json',
  'server/package-lock.json'
];

// Copy .env to the functions directory
const envPath = path.join(process.cwd(), '.env');
const envDestPath = path.join(functionsDir, '.env');
if (fs.existsSync(envPath)) {
  console.log('🔒 Copying .env file to functions directory');
  fs.copyFileSync(envPath, envDestPath);
} else {
  console.warn('⚠️  .env file not found. Make sure to set up your environment variables in Vercel.');
}

console.log('📁 Copying server files to functions directory...');
serverFiles.forEach(file => {
  const source = path.join(process.cwd(), file);
  const dest = path.join(functionsDir, path.basename(file));
  
  if (fs.existsSync(source)) {
    console.log(`- Copying ${file} to functions directory`);
    fs.copyFileSync(source, dest);
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
});

// Create vercel.json in the output directory
console.log('📝 Generating vercel.json...');
const vercelConfig = {
  version: 2,
  builds: [
    { src: 'server/server.js', use: '@vercel/node' },
    { src: 'client/package.json', use: '@vercel/static-build' }
  ],
  routes: [
    { src: '/api/(.*)', dest: 'server/server.js' },
    { src: '/(.*)', dest: 'client' }
  ]
};

fs.writeFileSync(
  path.join(vercelOutputDir, 'vercel.json'),
  JSON.stringify(vercelConfig, null, 2)
);

console.log('✅ Build completed successfully!');
