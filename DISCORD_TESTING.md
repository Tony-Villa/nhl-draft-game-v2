# Discord OAuth Testing Guide

This guide shows you how to test all Discord OAuth scenarios using the test endpoint.

## Test Endpoint

- **POST** `/api/test-discord-scenarios` - Run a scenario test
- **GET** `/api/test-discord-scenarios?discordUserId=123` - Get current state

## Test Scenarios

### Scenario B2: No Email + First Time User
Creates a new temp email user.

```bash
curl -X POST http://localhost:5173/api/test-discord-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "no_email_first_time",
    "discordUserId": "123456789",
    "username": "testuser1"
  }'
```

Expected Result: `created_new_user` with temp email `discord-temp-123456789@temp.nhl-draft-game.local`

### Scenario B1: No Email + Temp User Exists
Links Discord account to existing temp user.

```bash
# Run the same request again
curl -X POST http://localhost:5173/api/test-discord-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "no_email_existing_temp",
    "discordUserId": "123456789",
    "username": "testuser1"
  }'
```

Expected Result: `logged_in_existing_user` with temp email

### Scenario A2a: Real Email + Update Temp User
Updates existing temp user with real email.

```bash
curl -X POST http://localhost:5173/api/test-discord-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "real_email_update_temp",
    "discordUserId": "123456789",
    "email": "testuser1@example.com",
    "username": "testuser1"
  }'
```

Expected Result: `updated_temp_user_with_real_email`

### Scenario A1: Real Email + Merge Accounts
Tests account merging with draft priority rules.

```bash
# First, set up a temp user with 5 drafts
curl -X POST http://localhost:5173/api/test-discord-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "setup_temp_with_drafts",
    "discordUserId": "987654321",
    "setupData": {
      "createTempUser": true,
      "tempUserDraftCount": 5
    }
  }'

# Then, set up a real email user with 3 drafts
curl -X POST http://localhost:5173/api/test-discord-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "setup_real_with_drafts",
    "discordUserId": "987654321",
    "email": "testuser2@example.com",
    "setupData": {
      "createRealEmailUser": true,
      "realEmail": "testuser2@example.com",
      "realUserDraftCount": 3
    }
  }'

# Now test the merge (temp user should win because it has more drafts)
curl -X POST http://localhost:5173/api/test-discord-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "real_email_merge_accounts",
    "discordUserId": "987654321",
    "email": "testuser2@example.com",
    "username": "testuser2"
  }'
```

Expected Result: `logged_in_existing_user` with the temp user's drafts preserved

### Scenario A2b: Real Email + First Time User
Creates new user with real email.

```bash
curl -X POST http://localhost:5173/api/test-discord-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "real_email_first_time",
    "discordUserId": "555666777",
    "email": "newuser@example.com",
    "username": "newuser"
  }'
```

Expected Result: `created_new_user` with real email

## Check Current State

You can check the current state of any Discord user:

```bash
curl "http://localhost:5173/api/test-discord-scenarios?discordUserId=123456789"
```

This shows:
- Temp user (if exists) with draft count
- Real email users linked to this Discord ID with draft counts
- Current temp email pattern

## Draft Merging Rules Test

To test different draft merging scenarios:

```bash
# Test: Real user has more drafts
curl -X POST http://localhost:5173/api/test-discord-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "merge_real_wins",
    "discordUserId": "111222333",
    "email": "merge1@example.com",
    "setupData": {
      "createTempUser": true,
      "tempUserDraftCount": 2,
      "createRealEmailUser": true,
      "realEmail": "merge1@example.com",
      "realUserDraftCount": 10
    }
  }'

# Test: Both have 32 drafts (most recent wins)
curl -X POST http://localhost:5173/api/test-discord-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "merge_both_full",
    "discordUserId": "444555666",
    "email": "merge2@example.com",
    "setupData": {
      "createTempUser": true,
      "tempUserDraftCount": 32,
      "createRealEmailUser": true,
      "realEmail": "merge2@example.com",
      "realUserDraftCount": 32
    }
  }'
```

## What to Look For

1. **No duplicate users** - Check that temp users get updated rather than creating new users
2. **Draft preservation** - Verify drafts follow the merging rules
3. **Key linking** - Ensure Discord keys are properly linked
4. **Email updates** - Confirm temp emails get replaced with real emails
5. **Error handling** - Test edge cases and invalid data

## Clean Up

The test endpoint automatically cleans up test data before running scenarios, but you can manually clean up by deleting users with test emails from your database if needed.
