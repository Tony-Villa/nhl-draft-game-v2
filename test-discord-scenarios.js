#!/usr/bin/env node

// Test script for Discord OAuth scenarios
// Usage: node test-discord-scenarios.js

const BASE_URL = 'http://localhost:5173'; // Update this to your dev server URL

async function testScenario(scenario, testData) {
    console.log(`\n🧪 Testing: ${scenario}`);
    console.log('='.repeat(50));
    
    try {
        const response = await fetch(`${BASE_URL}/api/test-discord-scenarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Success!');
            console.log('Result:', JSON.stringify(result.result, null, 2));
        } else {
            console.log('❌ Failed!');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.log('❌ Network Error:', error.message);
    }
}

async function getState(discordUserId) {
    try {
        const response = await fetch(`${BASE_URL}/api/test-discord-scenarios?discordUserId=${discordUserId}`);
        const result = await response.json();
        console.log('\n📊 Current State for Discord User', discordUserId);
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.log('❌ Error getting state:', error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting Discord OAuth Scenario Tests');
    
    // Scenario B2: No email + No existing temp user (creates new temp user)
    await testScenario('B2: No email, first time login', {
        scenario: 'no_email_first_time',
        discordUserId: '123456789',
        username: 'testuser1'
    });
    
    await getState('123456789');
    
    // Scenario B1: No email + Temp user exists (links to existing temp user)
    await testScenario('B1: No email, temp user exists', {
        scenario: 'no_email_existing_temp',
        discordUserId: '123456789',
        username: 'testuser1'
    });
    
    // Scenario A2a: Real email + Temp user exists (updates temp user with real email)
    await testScenario('A2a: Real email, update temp user', {
        scenario: 'real_email_update_temp',
        discordUserId: '123456789',
        email: 'testuser1@example.com',
        username: 'testuser1'
    });
    
    await getState('123456789');
    
    // Test a new user for other scenarios
    const discordUserId2 = '987654321';
    
    // Scenario A1: Real email + Existing real email user + Temp user exists (merge accounts)
    await testScenario('Setup: Create temp user with drafts', {
        scenario: 'setup_temp_with_drafts',
        discordUserId: discordUserId2,
        setupData: {
            createTempUser: true,
            tempUserDraftCount: 5
        }
    });
    
    await testScenario('Setup: Create real email user with fewer drafts', {
        scenario: 'setup_real_with_drafts',
        discordUserId: discordUserId2,
        email: 'testuser2@example.com',
        setupData: {
            createRealEmailUser: true,
            realEmail: 'testuser2@example.com',
            realUserDraftCount: 3
        }
    });
    
    await getState(discordUserId2);
    
    await testScenario('A1: Real email, merge temp user (temp has more drafts)', {
        scenario: 'real_email_merge_accounts',
        discordUserId: discordUserId2,
        email: 'testuser2@example.com',
        username: 'testuser2'
    });
    
    await getState(discordUserId2);
    
    // Scenario A2b: Real email + No existing users (creates new user)
    await testScenario('A2b: Real email, first time user', {
        scenario: 'real_email_first_time',
        discordUserId: '555666777',
        email: 'newuser@example.com',
        username: 'newuser'
    });
    
    await getState('555666777');
    
    console.log('\n🎉 All tests completed!');
}

// Run the tests
runAllTests().catch(console.error);
