const dns = require('dns').promises;

/**
 * Checks an email address BEFORE we send it a verification code.
 *
 * Layers (cheap -> thorough):
 *  1. Typo in a popular domain (gmial.com -> "Did you mean gmail.com?")
 *  2. Disposable / throwaway inbox providers
 *  3. DNS: does the domain exist and accept email (MX records)?
 *  4. Optional: a verification API that asks the mail server whether the specific
 *     mailbox exists. Only runs if EMAIL_VERIFY_API_KEY is set in .env.
 *
 * Anything that goes wrong on OUR side (DNS timeout, API down, quota used up) lets the
 * signup through - the emailed code is still the final proof of ownership.
 */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'sharklasers.com',
  '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'tempmailo.com', 'yopmail.com', 'trashmail.com',
  'getnada.com', 'maildrop.cc', 'dispostable.com', 'fakeinbox.com', 'mailnesia.com', 'mohmal.com',
  'throwawaymail.com', 'emailondeck.com', 'mintemail.com', 'spamgourmet.com', 'moakt.com',
]);

const DOMAIN_TYPOS = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmil.com': 'gmail.com',
  'gnail.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmaill.com': 'gmail.com',
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com',
  'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'icloud.con': 'icloud.com', 'iclod.com': 'icloud.com',
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), ms)),
  ]);

const isMissing = (err) => err.code === 'ENOTFOUND' || err.code === 'ENODATA';

// true = can receive mail (or we can't tell), false = definitely can't
const domainCanReceiveMail = async (domain) => {
  try {
    const records = await withTimeout(dns.resolveMx(domain), 4000);
    // A lone "." exchange is a "null MX": the domain explicitly accepts no mail
    return records.some((r) => r.exchange && r.exchange !== '.');
  } catch (err) {
    if (!isMissing(err)) return true; // DNS trouble on our side - don't block the user
    // No MX at all: old-style fallback is delivery to the domain's A record
    try {
      const addresses = await withTimeout(dns.resolve4(domain), 4000);
      return addresses.length > 0;
    } catch (err2) {
      return !isMissing(err2);
    }
  }
};

// Optional mailbox-level check (Abstract "Email Reputation" API). Only "undeliverable" blocks signup.
const mailboxExists = async (email) => {
  const key = process.env.EMAIL_VERIFY_API_KEY;
  if (!key) return true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const url = `https://emailreputation.abstractapi.com/v1/?api_key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return true;
    const data = await res.json();
    // New Email Reputation shape: email_deliverability.status = deliverable | undeliverable | unknown
    // (old Email Validation shape kept as a fallback: deliverability = "UNDELIVERABLE")
    const status = data.email_deliverability?.status ?? data.deliverability;
    return String(status).toLowerCase() !== 'undeliverable';
  } catch (err) {
    return true;
  } finally {
    clearTimeout(timer);
  }
};

const checkEmailDeliverable = async (rawEmail) => {
  const email = String(rawEmail || '').trim().toLowerCase();
  const [local, domain] = email.split('@');
  if (!local || !domain || !domain.includes('.')) {
    return { ok: false, message: 'Enter a valid email address.' };
  }

  if (DOMAIN_TYPOS[domain]) {
    return { ok: false, message: `Did you mean ${local}@${DOMAIN_TYPOS[domain]}?` };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, message: 'Temporary email addresses are not allowed. Please use your real email.' };
  }

  if (!(await domainCanReceiveMail(domain))) {
    return { ok: false, message: `"${domain}" can't receive email. Check the address for typos.` };
  }

  if (!(await mailboxExists(email))) {
    return { ok: false, message: "This email address doesn't seem to exist. Check for typos or use a different one." };
  }

  return { ok: true };
};

module.exports = { checkEmailDeliverable };