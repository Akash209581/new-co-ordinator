const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';
const TARGET_MHID = 'MH26000005';

async function diagnose() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to:', MONGODB_URI.split('@')[1]); // Log host part only for security

        const db = mongoose.connection.db;

        // List collections to ensure we are in the right place
        const collections = await db.listCollections().toArray();
        console.log('📂 Collections found:', collections.map(c => c.name).join(', '));

        const collectionName = 'registrations';
        if (!collections.find(c => c.name === collectionName)) {
            console.error(`❌ Collection '${collectionName}' NOT FOUND!`);
            // Maybe it's 'Registration' or 'users'?
        } else {
            console.log(`✅ Collection '${collectionName}' exists.`);

            const doc = await db.collection(collectionName).findOne({ userId: TARGET_MHID });

            if (doc) {
                console.log(`📄 Document found for ${TARGET_MHID}:`);
                console.log('--------------------------------------------------');
                console.log(JSON.stringify(doc, null, 2));
                console.log('--------------------------------------------------');
                console.log('Checking specific fields:');
                console.log(`- college: '${doc.college}' (Type: ${typeof doc.college})`);
                console.log(`- registerId: '${doc.registerId}' (Type: ${typeof doc.registerId})`);
                console.log(`- phone: '${doc.phone}'`);

            } else {
                console.error(`❌ Document with userId: ${TARGET_MHID} NOT FOUND in '${collectionName}'`);
                // Try to list first 5 docs
                const first5 = await db.collection(collectionName).find().limit(5).toArray();
                console.log('First 5 docs userIds:', first5.map(d => d.userId));
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

diagnose();
