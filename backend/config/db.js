import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/Diavise';
        if (typeof uri !== 'string' || uri.trim() === '') {
            throw new Error('MONGO_URI is not set or is not a string. Set MONGO_URI in your .env');
        }
        
        // Connection options for stability
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 60000,
            connectTimeoutMS: 30000,
        };
        
        await mongoose.connect(uri, options);
        console.log('✅ MongoDB connected');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Will auto-reconnect...');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });
        
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.error('❌ The server will exit — check MONGO_URI and Atlas Network Access (allow 0.0.0.0/0).');
        // Give the log time to flush before exiting
        await new Promise(r => setTimeout(r, 3000));
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error during MongoDB disconnect:', err);
        process.exit(1);
    }
});