const mongoose = require('mongoose');
require('dotenv').config();

const Registration = require('../models/Registration');
const Participant = require('../models/Participant');

const verifySync = async () => {
    try {
        console.log('🔍 Verifying payment status synchronization...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get counts
        const paidInRegistrations = await Registration.countDocuments({ paymentStatus: 'paid' });
        const paidInParticipants = await Participant.countDocuments({ paymentStatus: 'paid' });
        const pendingInParticipants = await Participant.countDocuments({ paymentStatus: 'pending' });
        const unpaidInParticipants = await Participant.countDocuments({
            $or: [
                { paymentStatus: 'unpaid' },
                { paymentStatus: { $exists: false } }
            ]
        });

        console.log('📊 PAYMENT STATUS SUMMARY');
        console.log('='.repeat(60));
        console.log(`Registrations Collection:`);
        console.log(`  - Paid: ${paidInRegistrations}`);
        console.log('');
        console.log(`Participants Collection:`);
        console.log(`  - Paid: ${paidInParticipants}`);
        console.log(`  - Pending: ${pendingInParticipants}`);
        console.log(`  - Unpaid: ${unpaidInParticipants}`);
        console.log('='.repeat(60));

        // Check for specific user MH26000551
        console.log('\n🔍 Checking specific user: MH26000551');
        console.log('-'.repeat(60));

        const regStatus = await Registration.findOne({ userId: 'MH26000551' });
        const partStatus = await Participant.findOne({ userId: 'MH26000551' });

        if (regStatus) {
            console.log('Registration Collection:');
            console.log(`  - Name: ${regStatus.name}`);
            console.log(`  - Payment Status: ${regStatus.paymentStatus}`);
            console.log(`  - Payment Date: ${regStatus.paymentDate || 'N/A'}`);
            console.log(`  - Payment Method: ${regStatus.paymentMethod || 'N/A'}`);
        } else {
            console.log('Registration Collection: NOT FOUND');
        }

        console.log('');

        if (partStatus) {
            console.log('Participants Collection:');
            console.log(`  - Name: ${partStatus.name}`);
            console.log(`  - Payment Status: ${partStatus.paymentStatus}`);
            console.log(`  - Payment Date: ${partStatus.paymentDate || 'N/A'}`);
            console.log(`  - Payment Method: ${partStatus.paymentMethod || 'N/A'}`);
        } else {
            console.log('Participants Collection: NOT FOUND');
        }

        console.log('-'.repeat(60));

        // Check if they match
        if (regStatus && partStatus) {
            if (regStatus.paymentStatus === partStatus.paymentStatus) {
                console.log('✅ Payment status is SYNCHRONIZED for MH26000551');
            } else {
                console.log('❌ Payment status MISMATCH for MH26000551');
                console.log(`   Registration: ${regStatus.paymentStatus}`);
                console.log(`   Participant: ${partStatus.paymentStatus}`);
            }
        }

        console.log('\n✅ Verification complete!');

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    }
};

// Run the verification
verifySync();
