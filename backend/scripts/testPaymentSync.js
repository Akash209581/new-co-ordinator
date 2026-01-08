const mongoose = require('mongoose');
require('dotenv').config();

// Test the payment sync functionality
const testPaymentSync = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('=== TESTING PAYMENT SYNC ===\n');

        const db = mongoose.connection.db;

        // Find a registration that is marked as paid
        console.log('Looking for paid registrations...');
        const paidRegistration = await db.collection('registrations').findOne({
            paymentStatus: 'paid'
        });

        if (!paidRegistration) {
            console.log('No paid registrations found. Please mark a payment as paid first.');
            await mongoose.connection.close();
            process.exit(0);
            return;
        }

        console.log('\nFound paid registration:');
        console.log(`- User ID: ${paidRegistration.userId}`);
        console.log(`- Name: ${paidRegistration.name}`);
        console.log(`- Payment Status: ${paidRegistration.paymentStatus}`);
        console.log(`- Amount: ${paidRegistration.amount}`);

        // Check if this user exists in participants collection
        console.log('\nChecking participants collection...');
        const participant = await db.collection('test.participants').findOne({
            participantId: paidRegistration.userId
        });

        if (participant) {
            console.log('\nParticipant found:');
            console.log(`- Participant ID: ${participant.participantId}`);
            console.log(`- Name: ${participant.name}`);
            console.log(`- Payment Status: ${participant.paymentStatus}`);
            console.log(`- Payment Date: ${participant.paymentDate}`);

            if (participant.paymentStatus === 'paid') {
                console.log('\n✅ SUCCESS: Payment status is synced correctly!');
            } else {
                console.log('\n⚠️ WARNING: Payment status is NOT synced.');
                console.log('Expected: paid');
                console.log('Actual:', participant.paymentStatus);
            }
        } else {
            console.log('\n⚠️ No participant found with this ID in participants collection.');
            console.log('This is normal if the user has not registered for any events yet.');
        }

        // Show statistics
        console.log('\n=== STATISTICS ===');
        const paidInRegistrations = await db.collection('registrations').countDocuments({
            paymentStatus: 'paid'
        });
        const paidInParticipants = await db.collection('test.participants').countDocuments({
            paymentStatus: 'paid'
        });

        console.log(`Paid in registrations: ${paidInRegistrations}`);
        console.log(`Paid in participants: ${paidInParticipants}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

testPaymentSync();
