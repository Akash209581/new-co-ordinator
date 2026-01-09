const mongoose = require('mongoose');
require('dotenv').config();

const Registration = require('../models/Registration');
const Participant = require('../models/Participant');

const syncPaymentStatus = async () => {
    try {
        console.log('🔄 Starting payment status synchronization...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all paid registrations
        const paidRegistrations = await Registration.find({
            paymentStatus: 'paid'
        }).lean();

        console.log(`📊 Found ${paidRegistrations.length} paid registrations\n`);

        let updatedCount = 0;
        let notFoundCount = 0;
        let alreadySyncedCount = 0;

        for (const registration of paidRegistrations) {
            const userId = registration.userId || registration.registerId;

            console.log(`\n🔍 Processing: ${userId} (${registration.name})`);
            console.log(`   Registration Status: ${registration.paymentStatus}`);
            console.log(`   Payment Date: ${registration.paymentDate}`);
            console.log(`   Payment Method: ${registration.paymentMethod || 'N/A'}`);

            // Find matching participant(s) in participants collection
            const participants = await Participant.find({
                $or: [
                    { userId: registration.userId },
                    { userId: registration.registerId }
                ]
            });

            if (participants.length === 0) {
                console.log(`   ⚠️  No matching participant found in participants collection`);
                notFoundCount++;
                continue;
            }

            console.log(`   📌 Found ${participants.length} matching participant(s)`);

            for (const participant of participants) {
                // Check if already synced
                if (participant.paymentStatus === 'paid') {
                    console.log(`   ✓  Already synced (paymentStatus: paid)`);
                    alreadySyncedCount++;
                    continue;
                }

                // Update participant payment status
                const updateResult = await Participant.updateOne(
                    { _id: participant._id },
                    {
                        $set: {
                            paymentStatus: 'paid',
                            paymentDate: registration.paymentDate || new Date(),
                            paymentMethod: registration.paymentMethod || 'cash',
                            paymentNotes: registration.paymentNotes || 'Synced from registration',
                            processedBy: registration.processedBy
                        }
                    }
                );

                if (updateResult.modifiedCount > 0) {
                    console.log(`   ✅ Updated participant: ${participant._id}`);
                    console.log(`      Old status: ${participant.paymentStatus} → New status: paid`);
                    updatedCount++;
                } else {
                    console.log(`   ⚠️  Update failed for participant: ${participant._id}`);
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 SYNCHRONIZATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total paid registrations processed: ${paidRegistrations.length}`);
        console.log(`Participants updated: ${updatedCount}`);
        console.log(`Already synced: ${alreadySyncedCount}`);
        console.log(`Not found in participants collection: ${notFoundCount}`);
        console.log('='.repeat(60));

        // Verification: Check current counts
        console.log('\n🔍 VERIFICATION:');
        const paidInRegistrations = await Registration.countDocuments({ paymentStatus: 'paid' });
        const paidInParticipants = await Participant.countDocuments({ paymentStatus: 'paid' });

        console.log(`Paid in registrations collection: ${paidInRegistrations}`);
        console.log(`Paid in participants collection: ${paidInParticipants}`);

        if (paidInParticipants >= paidInRegistrations) {
            console.log('✅ Synchronization successful! Participants collection is up to date.');
        } else {
            console.log('⚠️  Some participants may not have been synced. Check the logs above.');
        }

    } catch (error) {
        console.error('❌ Error during synchronization:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
};

// Run the synchronization
syncPaymentStatus();
