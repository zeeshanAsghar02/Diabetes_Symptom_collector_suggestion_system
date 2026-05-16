import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const testEmail = process.env.DIAGNOSE_EMAIL || process.argv[2];
const testPassword = process.env.DIAGNOSE_PASSWORD || process.argv[3];

if (!MONGODB_URI) {
    console.error('❌ MONGO_URI not set in environment');
    process.exit(1);
}

if (!testEmail || !testPassword) {
    console.error('❌ Missing credentials for diagnosis.');
    console.error('Usage: node diagnose-login.mjs <email> <password>');
    console.error('Or set DIAGNOSE_EMAIL and DIAGNOSE_PASSWORD in environment.');
    process.exit(1);
}

console.log('🔗 Connecting to MongoDB...');
await mongoose.connect(MONGODB_URI);

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

try {
    console.log('\n🔍 Searching for user:', testEmail);
    
    // Search with lowercase email
    const user = await User.findOne({ email: testEmail.toLowerCase() });
    
    if (!user) {
        console.log('❌ User not found in database!');
        console.log('   Email searched:', testEmail.toLowerCase());
        
        // Try searching without normalization
        const userAny = await User.findOne({ email: testEmail });
        if (userAny) {
            console.log('\n⚠️ Found user with different email casing:');
            console.log('   Stored as:', userAny.email);
        } else {
            console.log('   Also not found with original casing.');
        }
        
        // List all users to see what's there
        const allUsers = await User.find({}).select('email authProvider password').limit(5);
        console.log('\n📋 Sample of users in database:');
        allUsers.forEach((u, i) => {
            console.log(`   ${i+1}. Email: ${u.email}, AuthProvider: ${u.authProvider}, HasPassword: ${!!u.password}`);
        });
    } else {
        console.log('✅ User found!');
        console.log('\n📊 User Details:');
        console.log('   Email:', user.email);
        console.log('   Full Name:', user.fullName);
        console.log('   Auth Provider:', user.authProvider);
        console.log('   Is Activated:', user.isActivated);
        console.log('   Deleted At:', user.deleted_at);
        console.log('   Has Password:', !!user.password);
        console.log('   Password Length:', user.password ? user.password.length : 0);
        console.log('   Password Starts With:', user.password ? user.password.substring(0, 10) + '...' : 'N/A');
        
        if (user.password) {
            console.log('\n🔐 Testing Password Comparison:');
            try {
                const isMatch = await bcrypt.compare(testPassword, user.password);
                console.log('   Password "' + testPassword + '" matches:', isMatch);
                
                if (!isMatch) {
                    console.log('   ❌ Password does NOT match!');
                    console.log('   Stored hash:', user.password);
                    
                    // Try comparing with a few variations
                    console.log('\n   Testing common password variations:');
                    const variations = [
                        testPassword.trim(),
                        testPassword.toLowerCase(),
                        testPassword.toUpperCase(),
                        testPassword + ' ',
                        ' ' + testPassword,
                    ];
                    
                    for (const variation of variations) {
                        const matches = await bcrypt.compare(variation, user.password);
                        if (matches) {
                            console.log('   ✅ MATCH FOUND with variation:', JSON.stringify(variation));
                        }
                    }
                } else {
                    console.log('   ✅ Password matches correctly!');
                }
            } catch (err) {
                console.error('   ❌ Error comparing password:', err.message);
            }
        } else {
            console.log('   ⚠️ User has NO password stored!');
            console.log('   This user might be Google OAuth only.');
        }
    }
} catch (err) {
    console.error('❌ Error:', err.message);
} finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
}
