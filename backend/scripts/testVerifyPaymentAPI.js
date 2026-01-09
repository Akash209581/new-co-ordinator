const fetch = require('node-fetch');

const testVerifyPayment = async () => {
    try {
        console.log('🧪 Testing /verify-payment endpoint for MH26000551\n');

        const response = await fetch('http://localhost:5005/api/teams/verify-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mhid: 'MH26000551' })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.raw());

        const data = await response.json();

        console.log('\n📦 API Response:');
        console.log(JSON.stringify(data, null, 2));

        console.log('\n🔍 Checking registeredEvents:');
        if (data.registeredEvents && data.registeredEvents.length > 0) {
            console.log(`✅ Found ${data.registeredEvents.length} registered event(s)`);
            data.registeredEvents.forEach((event, index) => {
                console.log(`\nEvent ${index + 1}:`);
                console.log(`  - eventName: "${event.eventName}"`);
                console.log(`  - eventType: "${event.eventType}"`);
                console.log(`  - category: "${event.category}"`);
                console.log(`  - eventId: ${event.eventId || 'MISSING'}`);
            });
        } else {
            console.log('❌ No registeredEvents in response!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testVerifyPayment();
