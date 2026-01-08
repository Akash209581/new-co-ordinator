const mongoose = require('mongoose');
require('dotenv').config();

const verifyDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('=== DATABASE VERIFICATION ===\n');

        const db = mongoose.connection.db;

        // List all collections
        console.log('Available collections:');
        const collections = await db.listCollections().toArray();
        collections.forEach(col => console.log(`  - ${col.name}`));

        // Check registrations collection
        console.log('\n--- REGISTRATIONS COLLECTION ---');
        const totalRegistrations = await db.collection('registrations').countDocuments({});
        console.log(`Total documents: ${totalRegistrations}`);

        const paidRegistrations = await db.collection('registrations').countDocuments({
            paymentStatus: 'paid'
        });
        console.log(`Documents with paymentStatus "paid": ${paidRegistrations}`);

        const unpaidRegistrations = await db.collection('registrations').countDocuments({
            paymentStatus: 'unpaid'
        });
        console.log(`Documents with paymentStatus "unpaid": ${unpaidRegistrations}`);

        // Check participants collection (without 'test.' prefix)
        console.log('\n--- PARTICIPANTS COLLECTION ---');
        const totalParticipants = await db.collection('participants').countDocuments({});
        console.log(`Total documents: ${totalParticipants}`);

        const pendingParticipants = await db.collection('participants').countDocuments({
            paymentStatus: 'pending'
        });
        console.log(`Documents with paymentStatus "pending": ${pendingParticipants}`);

        const paidParticipants = await db.collection('participants').countDocuments({
            paymentStatus: 'paid'
        });
        console.log(`Documents with paymentStatus "paid": ${paidParticipants}`);

        // Sample participant
        console.log('\n--- SAMPLE PARTICIPANT ---');
        const sampleParticipant = await db.collection('participants').findOne({});
        if (sampleParticipant) {
            console.log(`userId: ${sampleParticipant.userId}`);
            console.log(`participantId: ${sampleParticipant.participantId}`);
            console.log(`name: ${sampleParticipant.name}`);
            console.log(`paymentStatus: ${sampleParticipant.paymentStatus}`);
        }

        console.log('\n=== VERIFICATION COMPLETE ===');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

verifyDatabase();
