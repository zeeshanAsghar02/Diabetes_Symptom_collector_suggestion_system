import mongoose from 'mongoose';

function extractMongoHost(uri) {
    const trimmed = String(uri || '').trim();

    if (trimmed.startsWith('mongodb+srv://') || trimmed.startsWith('mongodb://')) {
        const withoutScheme = trimmed.replace(/^mongodb(\+srv)?:\/\//, '');
        const hostSection = withoutScheme.split('/')[0] || '';
        const hostPart = hostSection.includes('@') ? hostSection.split('@')[1] : hostSection;
        return (hostPart || '').split(',')[0].trim();
    }

    return '';
}

function validateMongoUri(uri) {
    const normalized = String(uri || '').trim().replace(/^['\"]|['\"]$/g, '');
    const isSrv = normalized.startsWith('mongodb+srv://');
    if (!normalized) {
        throw new Error('MONGO_URI is empty. Set a valid MongoDB connection string.');
    }

    if (!/^mongodb(\+srv)?:\/\//.test(normalized)) {
        throw new Error('MONGO_URI must start with mongodb:// or mongodb+srv://');
    }

    const host = extractMongoHost(normalized);
    if (!host) {
        throw new Error('MONGO_URI host is missing.');
    }

    // Prevent obvious malformed SRV host values like "468" seen in failed staging runs.
    if ((isSrv && !host.includes('.')) || /^\d+$/.test(host)) {
        throw new Error(`MONGO_URI host appears malformed: "${host}"`);
    }

    return { normalized, host };
}

export const connectDB = async () => {
    const configuredUri = process.env.MONGO_URI;
    const fallbackUri = 'mongodb://localhost:27017/Diavise';

    if (!configuredUri && process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI is required in production environment.');
    }

    const { normalized: uri, host } = validateMongoUri(configuredUri || fallbackUri);
    console.log(`Mongo target host: ${host}`);

    // Connection options for stability
    const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 30000,
    };

    const connectWithRetry = async () => {
        try {
            await mongoose.connect(uri, options);
            console.log('✅ MongoDB connected');

            // Handle connection events
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️  MongoDB disconnected. Will attempt to reconnect...');
                // Try to reconnect
                setTimeout(() => connectWithRetry(), 5000);
            });

            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB reconnected');
            });

        } catch (err) {
            console.error('❌ MongoDB connection failed:', err.message);
            console.error('Retrying MongoDB connection in 5 seconds...');
            setTimeout(() => connectWithRetry(), 5000);
        }
    };

    // Start initial connect attempt (don't exit process on failures)
    await connectWithRetry();
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