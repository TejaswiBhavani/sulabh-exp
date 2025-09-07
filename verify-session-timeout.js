#!/usr/bin/env node

// Simple verification script for session timeout configuration
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying 5-minute session timeout implementation...\n');

// Check server.js configuration
console.log('📁 Checking server.js configuration:');
const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

const checks = [
  {
    name: 'Rolling sessions enabled',
    check: serverJs.includes('resave: true') && serverJs.includes('rolling: true'),
    details: 'resave: true, rolling: true'
  },
  {
    name: 'Cookie maxAge set to 5 minutes',
    check: serverJs.includes('maxAge: 5 * 60 * 1000'),
    details: 'maxAge: 5 * 60 * 1000 (300000ms)'
  },
  {
    name: 'MongoDB TTL configured',
    check: serverJs.includes('ttl: 5 * 60'),
    details: 'ttl: 5 * 60 (5 minutes)'
  },
  {
    name: 'Touch behavior set to immediate',
    check: serverJs.includes('touchAfter: 0'),
    details: 'touchAfter: 0 (immediate updates)'
  },
  {
    name: 'Security settings maintained',
    check: serverJs.includes('httpOnly: true') && 
           serverJs.includes('sameSite: \'lax\'') &&
           serverJs.includes('secure: process.env.NODE_ENV === \'production\''),
    details: 'httpOnly, sameSite=lax, secure in production'
  }
];

checks.forEach(check => {
  console.log(`   ${check.check ? '✅' : '❌'} ${check.name}: ${check.details}`);
});

// Check User model
console.log('\n📁 Checking User model:');
const userModel = fs.readFileSync(path.join(__dirname, 'models/User.js'), 'utf8');

const userChecks = [
  {
    name: 'Default session expiry set to 5 minutes',
    check: userModel.includes('5 * 60 * 1000') && userModel.includes('// 5 minutes'),
    details: 'expiresAt default: 5 * 60 * 1000'
  },
  {
    name: 'Touch session method added',
    check: userModel.includes('touchSession'),
    details: 'touchSession method for rolling behavior'
  },
  {
    name: 'Remember me support in touchSession',
    check: userModel.includes('30 * 24 * 60 * 60 * 1000') && userModel.includes('timeDiff'),
    details: 'Handles both 5-min and 30-day sessions'
  }
];

userChecks.forEach(check => {
  console.log(`   ${check.check ? '✅' : '❌'} ${check.name}: ${check.details}`);
});

// Check auth routes
console.log('\n📁 Checking auth routes:');
const authRoutes = fs.readFileSync(path.join(__dirname, 'routes/auth.js'), 'utf8');

const authChecks = [
  {
    name: 'Regular login set to 5 minutes',
    check: authRoutes.includes('req.session.cookie.maxAge = 5 * 60 * 1000'),
    details: 'maxAge: 5 * 60 * 1000 for regular sessions'
  },
  {
    name: 'Remember me maintains 30 days',
    check: authRoutes.includes('30 * 24 * 60 * 60 * 1000'),
    details: 'Remember me: 30 days rolling'
  }
];

authChecks.forEach(check => {
  console.log(`   ${check.check ? '✅' : '❌'} ${check.name}: ${check.details}`);
});

// Check auth middleware
console.log('\n📁 Checking auth middleware:');
const authMiddleware = fs.readFileSync(path.join(__dirname, 'middleware/auth.js'), 'utf8');

const middlewareChecks = [
  {
    name: 'Session touching on auth requests',
    check: authMiddleware.includes('await user.touchSession(req.sessionID)'),
    details: 'touchSession called in requireAuth middleware'
  }
];

middlewareChecks.forEach(check => {
  console.log(`   ${check.check ? '✅' : '❌'} ${check.name}: ${check.details}`);
});

// Summary
const allChecks = [...checks, ...userChecks, ...authChecks, ...middlewareChecks];
const passed = allChecks.filter(check => check.check).length;
const total = allChecks.length;

console.log(`\n📊 Implementation Verification: ${passed}/${total} checks passed`);

if (passed === total) {
  console.log('🎉 All checks passed! 5-minute rolling session timeout is properly implemented.');
  console.log('\n📋 Expected behavior:');
  console.log('   • Sessions expire after 5 minutes of inactivity');
  console.log('   • Each authenticated request resets the 5-minute timer');
  console.log('   • MongoDB automatically cleans up expired sessions');
  console.log('   • "Remember me" sessions use 30-day rolling timeout');
  console.log('   • All security settings (httpOnly, secure, sameSite) maintained');
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}

console.log('\n🔧 To test the implementation:');
console.log('   1. Start the server: node server.js');
console.log('   2. Login via POST /api/auth/login');
console.log('   3. Make requests to authenticated endpoints every few minutes');
console.log('   4. Stop making requests and wait 5+ minutes');
console.log('   5. Verify session has expired');