const mongoose = require('mongoose');
const Registration = require('./models/Registration'); // Adjust path as needed
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function updatePaymentStatus() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const result = await Registration.updateMany(
            {},
            {
                $set: {
                    paymentStatus: 'unpaid',
                    paymentMethod: null,
                    paymentNotes: null,
                    processedBy: null,
                    isPaid: false // Ensure this boolean flag is also synced if it exists
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} registrations:`);
        console.log('  - Set paymentStatus to "unpaid"');
        console.log('  - Cleared paymentMethod');
        console.log('  - Cleared paymentNotes');
        console.log('  - Cleared processedBy');

    } catch (error) {
        console.error('❌ Error updating registrations:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit();
    }
}

updatePaymentStatus();
