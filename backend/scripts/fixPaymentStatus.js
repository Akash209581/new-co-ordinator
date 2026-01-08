const mongoose = require('mongoose');
require('dotenv').config();

// Fix the mistake - sync payment status correctly from registrations to participants
const fixPaymentStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // STEP 1: Reset all participants to pending first
        console.log('Step 1: Resetting all participants to pending...');
        const resetResult = await db.collection('participants').updateMany(
            {},
            {
                $set: {
                    paymentStatus: 'pending'
                }
            }
        );
        console.log(`Reset ${resetResult.modifiedCount} participants to pending\n`);

        // STEP 2: Get all paid registrations
        console.log('Step 2: Finding paid registrations...');
        const paidRegistrations = await db.collection('registrations').find({
            paymentStatus: 'paid'
        }).toArray();

        console.log(`Found ${paidRegistrations.length} paid registrations\n`);

        // STEP 3: Update participants to paid only if they are paid in registrations
        console.log('Step 3: Updating participants based on paid registrations...');
        let updatedCount = 0;

        for (const registration of paidRegistrations) {
            const userId = registration.userId || registration.registerId;

            const result = await db.collection('participants').updateMany(
                {
                    $or: [
                        { participantId: userId },
                        { userId: userId }
                    ]
                },
                {
                    $set: {
                        paymentStatus: 'paid',
                        paymentDate: registration.paymentDate,
                        paymentMethod: registration.paymentMethod || 'cash',
                        paymentNotes: registration.paymentNotes || ''
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`  ✓ Updated ${result.modifiedCount} participant(s) for ${userId}`);
                updatedCount += result.modifiedCount;
            }
        }

        console.log(`\nTotal participants updated to paid: ${updatedCount}`);

        // STEP 4: Verify
        console.log('\n=== VERIFICATION ===');
        const pendingCount = await db.collection('participants').countDocuments({
            paymentStatus: 'pending'
        });

        const paidCount = await db.collection('participants').countDocuments({
            paymentStatus: 'paid'
        });

        console.log(`Participants with "pending" status: ${pendingCount}`);
        console.log(`Participants with "paid" status: ${paidCount}`);
        console.log(`Registrations with "paid" status: ${paidRegistrations.length}`);

        console.log('\n✅ Fix completed successfully!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

fixPaymentStatus();
