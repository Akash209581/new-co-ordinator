const mongoose = require('mongoose');
const Coordinator = require('../models/Coordinator');
const Registration = require('../models/Registration');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function showCoordinatorPayments() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all coordinators
    const coordinators = await Coordinator.find({}).select('_id username firstName lastName email role');

    console.log('='.repeat(80));
    console.log('ALL COORDINATORS IN SYSTEM:');
    console.log('='.repeat(80));
    console.log('');

    coordinators.forEach(coord => {
        console.log(`ID: ${coord._id}`);
        console.log(`  Username: ${coord.username}`);
        console.log(`  Name: ${coord.firstName} ${coord.lastName}`);
        console.log(`  Email: ${coord.email}`);
        console.log(`  Role: ${coord.role}`);
        console.log('');
    });

    console.log('='.repeat(80));
    console.log('PAYMENTS PROCESSED BY EACH COORDINATOR:');
    console.log('='.repeat(80));
    console.log('');

    for (const coord of coordinators) {
        // Get payments processed by this coordinator
        const payments = await Registration.find({
            processedBy: coord._id,
            paymentStatus: 'paid'
        }).select('userId name amount paymentMethod paymentDate');

        if (payments.length > 0) {
            console.log(`Coordinator: ${coord.firstName} ${coord.lastName} (${coord.username})`);
            console.log(`  ID: ${coord._id}`);
            console.log(`  Payments Processed: ${payments.length}`);

            let totalAmount = 0;
            payments.forEach((payment, index) => {
                totalAmount += payment.amount || 0;
                console.log(`  ${index + 1}. ${payment.userId} - ${payment.name}`);
                console.log(`     Amount: Rs.${payment.amount || 0} (${payment.paymentMethod})`);
                console.log(`     Date: ${payment.paymentDate}`);
            });

            console.log(`  TOTAL COLLECTED: Rs.${totalAmount}`);
            console.log('');
            console.log('-'.repeat(80));
            console.log('');
        }
    }

    // Show payments with no coordinator assigned
    const unassignedPayments = await Registration.find({
        paymentStatus: 'paid',
        $or: [
            { processedBy: null },
            { processedBy: { $exists: false } }
        ]
    }).select('userId name amount paymentMethod paymentDate');

    if (unassignedPayments.length > 0) {
        console.log('PAYMENTS WITHOUT COORDINATOR ASSIGNMENT:');
        console.log('-'.repeat(80));
        unassignedPayments.forEach((payment, index) => {
            console.log(`${index + 1}. ${payment.userId} - ${payment.name}`);
            console.log(`   Amount: Rs.${payment.amount || 0} (${payment.paymentMethod})`);
        });
        console.log('');
    }

    await mongoose.connection.close();
}

showCoordinatorPayments().catch(console.error);
