const mongoose = require('mongoose');
require('dotenv').config();

const checkParticipantEvents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check MH26000551 specifically
        const db = mongoose.connection.db;

        console.log('🔍 Checking MH26000551 in participants collection:');
        console.log('='.repeat(60));

        const participant = await db.collection('participants').findOne({
            userId: 'MH26000551'
        });

        if (participant) {
            console.log('✅ Found participant!');
            console.log('\nFull participant record:');
            console.log(JSON.stringify(participant, null, 2));

            console.log('\n📋 Registered Events:');
            if (participant.registeredEvents && participant.registeredEvents.length > 0) {
                participant.registeredEvents.forEach((event, index) => {
                    console.log(`\nEvent ${index + 1}:`);
                    console.log(`  - eventName: "${event.eventName}"`);
                    console.log(`  - eventType: "${event.eventType}"`);
                    console.log(`  - category: "${event.category}"`);
                    console.log(`  - eventId: ${event.eventId || 'N/A'}`);
                    console.log(`  - _id: ${event._id || 'N/A'}`);
                });
            } else {
                console.log('  ⚠️  No registered events found!');
            }
        } else {
            console.log('❌ Participant not found in participants collection');
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n🔍 Checking MH26000551 in registrations collection:');
        console.log('='.repeat(60));

        const registration = await db.collection('registrations').findOne({
            userId: 'MH26000551'
        });

        if (registration) {
            console.log('✅ Found registration!');
            console.log(`  - Name: ${registration.name}`);
            console.log(`  - College: ${registration.college}`);
            console.log(`  - Payment Status: ${registration.paymentStatus}`);
            console.log(`  - User Type: ${registration.userType}`);
            console.log(`  - Participation Type: ${registration.participationType}`);
        } else {
            console.log('❌ Registration not found');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
};

checkParticipantEvents();
