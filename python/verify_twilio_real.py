import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# TEST RECIPIENT FROM USER SIGNOFF
TEST_RECIPIENT = "+16154366176"

def verify_sms():
    print(f"--- Testing SMS to {TEST_RECIPIENT} ---")
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        print("Error: Missing Twilio credentials in .env")
        return
    
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    try:
        message = client.messages.create(
            body="r u good? - Live Twilio Verification Test. This confirms your SMS service is active. 🥳",
            from_=TWILIO_PHONE_NUMBER,
            to=TEST_RECIPIENT
        )
        print(f"SMS Sent! SID: {message.sid}")
    except Exception as e:
        print(f"SMS Failed: {e}")

def verify_voice():
    print(f"\n--- Testing Voice Call to {TEST_RECIPIENT} ---")
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        print("Error: Missing Twilio credentials in .env")
        return
    
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    try:
        # Using a public TwiML bin for testing to avoid server dependencies
        # This one just says "This is a test call from 'r u good?'"
        twiml_url = "http://demo.twilio.com/docs/voice.xml" 
        
        call = client.calls.create(
            url=twiml_url,
            to=TEST_RECIPIENT,
            from_=TWILIO_PHONE_NUMBER
        )
        print(f"Voice Call Initiated! SID: {call.sid}")
    except Exception as e:
        print(f"Voice Call Failed: {e}")

if __name__ == "__main__":
    verify_sms()
    verify_voice()
