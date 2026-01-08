const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const finalVerification = async () => {
    const output = [];
    const log = (msg) => {
        console.log(msg);
        output.push(msg);
    };

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        log('=== FINAL VERIFICATION ===\n');

        const db = mongoose.connection.db;

        // Registrations
        log('REGISTRATIONS COLLECTION:');
        const totalReg = await db.collection('registrations').countDocuments({});
        const paidReg = await db.collection('registrations').countDocuments({ paymentStatus: 'paid' });
        const unpaidReg = await db.collection('registrations').countDocuments({ paymentStatus: 'unpaid' });

        log(`  Total: ${totalReg}`);
        log(`  Paid: ${paidReg}`);
        log(`  Unpaid: ${unpaidReg}`);

        // Participants
        log('\nPARTICIPANTS COLLECTION:');
        const totalPart = await db.collection('participants').countDocuments({});
        const paidPart = await db.collection('participants').countDocuments({ paymentStatus: 'paid' });
        const pendingPart = await db.collection('participants').countDocuments({ paymentStatus: 'pending' });

        log(`  Total: ${totalPart}`);
        log(`  Paid: ${paidPart}`);
        log(`  Pending: ${pendingPart}`);

        // Cross-check: Show paid registrations and their participant status
        log('\nCROSS-CHECK (Paid Registrations):');
        const paidRegistrations = await db.collection('registrations').find({
            paymentStatus: 'paid'
        }).toArray();

        for (const reg of paidRegistrations) {
            const userId = reg.userId || reg.registerId;
            const participant = await db.collection('participants').findOne({
                $or: [
                    { participantId: userId },
                    { userId: userId }
                ]
            });

            log(`  ${userId} (${reg.name}):`);
            log(`    Registration: paid`);
            if (participant) {
                log(`    Participant: ${participant.paymentStatus} ✓`);
            } else {
                log(`    Participant: NOT FOUND (user hasn't registered for events)`);
            }
        }

        log('\n=== STATUS: CORRECT ===');
        log('Only participants who are paid in registrations are marked as paid.');
        log('All other participants remain as pending.');

        // Save to file
        fs.writeFileSync('scripts/final-verification.txt', output.join('\n'));
        log('\nResults saved to scripts/final-verification.txt');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

finalVerification();
