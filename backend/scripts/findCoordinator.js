const mongoose = require('mongoose');
const Coordinator = require('../models/Coordinator');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function findCoordinator() {
    await mongoose.connect(MONGODB_URI);

    const coordinatorId = '6957e0ca57aee3517c8a5ffe';

    const coordinator = await Coordinator.findById(coordinatorId);

    if (coordinator) {
        console.log('Coordinator who processed your 3 payments:');
        console.log('');
        console.log('ID: ' + coordinator._id);
        console.log('Username: ' + coordinator.username);
        console.log('Name: ' + coordinator.firstName + ' ' + coordinator.lastName);
        console.log('Email: ' + coordinator.email);
        console.log('Role: ' + coordinator.role);
        console.log('Department: ' + (coordinator.department || 'N/A'));
    } else {
        console.log('Coordinator not found');
    }

    await mongoose.connection.close();
}

findCoordinator().catch(console.error);
