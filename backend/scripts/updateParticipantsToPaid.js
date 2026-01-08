const mongoose = require('mongoose');
require('dotenv').config();

// Migration to update all pending participants to paid
const updateParticipantsToPaid = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Update paymentStatus from "pending" to "paid" in participants
        console.log('Updating paymentStatus from "pending" to "paid" in participants...');

        const result = await db.collection('participants').updateMany(
            { paymentStatus: 'pending' },
            {
                $set: {
                    paymentStatus: 'paid'
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} participants`);

        // Verify
        const pendingCount = await db.collection('participants').countDocuments({
            paymentStatus: 'pending'
        });

        const paidCount = await db.collection('participants').countDocuments({
            paymentStatus: 'paid'
        });

        console.log('\nVerification:');
        console.log(`- Participants with "pending" status: ${pendingCount}`);
        console.log(`- Participants with "paid" status: ${paidCount}`);
        console.log('\nMigration completed!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

updateParticipantsToPaid();
