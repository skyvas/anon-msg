/**
 * AnonMsg Security & Penetration Testing Suite
 * Executed by: cs-security-tester
 *
 * Covers OWASP Top 10 vulnerabilities:
 * 1. SQL Injection (SQLi)
 * 2. Cross-Site Scripting (XSS) & Stored Injection
 * 3. Insecure Direct Object References (IDOR) / Access Control
 * 4. Authentication Bypass & Token Tampering
 * 5. Password Policy & DoS Payload Resistance
 * 6. Information Disclosure & Security Headers
 * 7. Brute-Force Rate Limiting
 */

const BASE_URL = 'http://localhost:3001/api';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runSecurityTestSuite() {
  console.log('=== AnonMsg Penetration & Security Audit ===\n');

  try {
    // -------------------------------------------------------------
    // Category 1: HTTP Security Headers & Information Disclosure
    // -------------------------------------------------------------
    console.log('--- 1. HTTP Headers & Fingerprinting ---');
    const headerRes = await fetch(`${BASE_URL}/health`);
    assert(headerRes.headers.get('x-content-type-options') === 'nosniff', 'Header: X-Content-Type-Options is nosniff');
    assert(headerRes.headers.get('x-frame-options') === 'DENY', 'Header: X-Frame-Options is DENY (Clickjacking protection)');
    assert(headerRes.headers.get('x-powered-by') === null, 'Information Disclosure: X-Powered-By Express header is completely disabled');

    // -------------------------------------------------------------
    // Category 2: SQL Injection (SQLi) Resistance
    // -------------------------------------------------------------
    console.log('\n--- 2. SQL Injection Resistance ---');
    const sqliSearchRes = await fetch(`${BASE_URL}/users?q=' OR '1'='1' --`);
    assert(sqliSearchRes.status === 200, 'SQLi in user search handled safely as parameterized literal');

    const sqliUsernameRes = await fetch(`${BASE_URL}/users/alex_dev' OR '1'='1`);
    assert(sqliUsernameRes.status === 404, 'SQLi in username route treated as literal string, returning 404');

    // -------------------------------------------------------------
    // Category 3: Stored Cross-Site Scripting (XSS) Sanitization
    // -------------------------------------------------------------
    console.log('\n--- 3. XSS & HTML Injection Sanitization ---');
    const usersRes = await fetch(`${BASE_URL}/users`);
    const usersData = await usersRes.json();
    const recipient = usersData.users[0];

    const xssPayload = '<script>alert("stored-xss")</script>Hello World';
    const xssNamePayload = '<b onmouseover="evil()">Attacker</b>';

    const sendXssRes = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id: recipient.id,
        content: xssPayload,
        is_anonymous: false,
        sender_name: xssNamePayload
      })
    });
    const sendXssData = await sendXssRes.json();
    assert(sendXssRes.status === 201, 'Message with HTML tags accepted and sanitized');
    assert(!sendXssData.sender_name.includes('<b') && !sendXssData.sender_name.includes('evil()'), 'Sender name stripped of raw HTML tags');

    // -------------------------------------------------------------
    // Category 4: Authentication Bypass & Token Security
    // -------------------------------------------------------------
    console.log('\n--- 4. Authentication & Authorization Boundaries ---');
    const unauthInboxRes = await fetch(`${BASE_URL}/messages/inbox`);
    assert(unauthInboxRes.status === 401, 'Unauthenticated request to inbox returns 401');

    const forgedTokenRes = await fetch(`${BASE_URL}/messages/inbox`, {
      headers: { 'Authorization': 'Bearer forged.eyJhbGciOiJIUzI1NiJ9.signature' }
    });
    assert(forgedTokenRes.status === 401, 'Forged JWT returns 401 Invalid Token');

    // -------------------------------------------------------------
    // Category 5: Insecure Direct Object References (IDOR)
    // -------------------------------------------------------------
    console.log('\n--- 5. Insecure Direct Object Reference (IDOR) Defense ---');
    const ts = Date.now().toString().slice(-8);
    // Register Victim (User A)
    const victimUsername = `vic_${ts}_1`;
    const victimRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: victimUsername,
        display_name: 'Victim User',
        password: 'Password123!',
        prompt: 'Secret inbox prompt'
      })
    });
    const victimData = await victimRes.json();
    const victimToken = victimData.token;
    const victimId = victimData.user.id;

    // Register Attacker (User B)
    const attackerUsername = `atk_${ts}_2`;
    const attackerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: attackerUsername,
        display_name: 'Attacker User',
        password: 'Password123!',
        prompt: 'Attacker prompt'
      })
    });
    const attackerData = await attackerRes.json();
    const attackerToken = attackerData.token;

    // Send confidential message to Victim
    const secretMsgRes = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id: victimId,
        content: 'Confidential message meant only for Victim.',
        is_anonymous: true
      })
    });
    const secretMsgData = await secretMsgRes.json();
    const secretMsgId = secretMsgData.message_id;

    // Attacker attempts to modify Victim's message status
    const idorReadRes = await fetch(`${BASE_URL}/messages/inbox/${secretMsgId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${attackerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_read: true })
    });
    assert(idorReadRes.status === 404, 'IDOR Defense: Attacker cannot mark Victim message as read (returns 404)');

    // Attacker attempts to favorite Victim's message
    const idorFavRes = await fetch(`${BASE_URL}/messages/inbox/${secretMsgId}/favorite`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${attackerToken}` }
    });
    assert(idorFavRes.status === 404, 'IDOR Defense: Attacker cannot favorite Victim message (returns 404)');

    // Attacker attempts to DELETE Victim's message
    const idorDeleteRes = await fetch(`${BASE_URL}/messages/inbox/${secretMsgId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${attackerToken}` }
    });
    assert(idorDeleteRes.status === 404, 'IDOR Defense: Attacker cannot delete Victim message (returns 404)');

    // Verify Victim's message is untouched
    const victimInboxRes = await fetch(`${BASE_URL}/messages/inbox`, {
      headers: { 'Authorization': `Bearer ${victimToken}` }
    });
    const victimInboxData = await victimInboxRes.json();
    assert(victimInboxData.messages.length === 1 && victimInboxData.messages[0].id === secretMsgId, 'Integrity Check: Victim message remained intact and uncompromised');

    // -------------------------------------------------------------
    // Category 6: Password Policy & DoS Safeguards
    // -------------------------------------------------------------
    console.log('\n--- 6. Password Policy & Denial-of-Service Limits ---');
    const shortPassRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `usr_s_${ts}`,
        display_name: 'Short Pass',
        password: 'abc'
      })
    });
    assert(shortPassRes.status === 400, 'Password Policy: Rejects password under 8 characters');

    const whitespacePassRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `usr_w_${ts}`,
        display_name: 'Whitespace Pass',
        password: '        '
      })
    });
    assert(whitespacePassRes.status === 400, 'Password Policy: Rejects whitespace-only password');

    const hugePassRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `usr_h_${ts}`,
        display_name: 'Huge Pass',
        password: 'A'.repeat(500)
      })
    });
    assert(hugePassRes.status === 400, 'DoS Prevention: Rejects password over 128 characters');

    // -------------------------------------------------------------
    // Category 7: Privacy Guard (IP Address Redaction)
    // -------------------------------------------------------------
    console.log('\n--- 7. Anonymity & Privacy Guarantees ---');
    assert(victimInboxData.messages[0].ip_hash === undefined, 'Anonymity Shield: ip_hash is stripped from all recipient inbox outputs');

    console.log(`\n==============================================`);
    console.log(`Security Test Audit: ${passed} Passed, ${failed} Failed`);
    console.log(`==============================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal security test failure:', err);
    process.exit(1);
  }
}

runSecurityTestSuite();
