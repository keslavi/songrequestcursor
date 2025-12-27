import config from '../config.js';

const isTwilioConfigured = () => {
  return (
    config.sms?.provider === 'twilio' &&
    !!config.sms?.twilio?.accountSid &&
    !!config.sms?.twilio?.authToken &&
    !!config.sms?.twilio?.from
  );
};

const twilioSend = async (to, body) => {
  const accountSid = config.sms.twilio.accountSid;
  const authToken = config.sms.twilio.authToken;
  const from = config.sms.twilio.from;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const form = new URLSearchParams();
  form.set('From', from);
  form.set('To', to);
  form.set('Body', body);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio SMS failed: ${res.status} ${errText}`);
  }

  return await res.json();
};

export const smsService = {
  async sendVerificationCode(phoneNumber, code) {
    const message = `${config.sms?.verification?.messagePrefix || 'Your verification code is'}: ${code}`;

    if (!isTwilioConfigured()) {
      // Dev/default behavior: log code server-side so you can test without an SMS provider.
      console.log(`📱 [SMS:console] To ${phoneNumber}: ${message}`);
      return { provider: 'console' };
    }

    return await twilioSend(phoneNumber, message);
  }
};

export default smsService;


