"""
Quick test: sends a verification OTP email directly using your .env SMTP config.
Run with: venv\Scripts\python.exe test_verify_email.py your@email.com
"""
import sys
import os
from dotenv import load_dotenv

load_dotenv()

to_email = sys.argv[1] if len(sys.argv) > 1 else input("Enter test email address: ").strip()
code = "123456"

smtp_host = os.environ.get("MAIL_HOST", "smtp.gmail.com")
smtp_port = int(os.environ.get("MAIL_PORT", 587))
smtp_user = os.environ.get("MAIL_USERNAME")
smtp_pass = os.environ.get("MAIL_PASSWORD")
from_email = os.environ.get("MAIL_FROM_ADDRESS", smtp_user)
from_name = os.environ.get("MAIL_FROM_NAME", "r u good? AI")

print("=" * 50)
print(f"SMTP Host:     {smtp_host}")
print(f"SMTP Port:     {smtp_port}")
print(f"SMTP User:     {smtp_user}")
print(f"SMTP Pass:     {'*' * len(smtp_pass) if smtp_pass else 'NOT SET'}")
print(f"From email:    {from_email}")
print(f"Sending to:    {to_email}")
print("=" * 50)

if not smtp_user or not smtp_pass:
    print("[ERROR] MAIL_USERNAME or MAIL_PASSWORD is not set in .env!")
    sys.exit(1)

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

msg = MIMEMultipart()
msg['From'] = f"{from_name} <{from_email}>"
msg['To'] = to_email
msg['Subject'] = "TEST - Verify Your Email - r u good?"

html_content = (
    "<html><body style='font-family:Arial,sans-serif;background:#0a0a0a;padding:20px;'>"
    "<div style='max-width:560px;margin:0 auto;background:#1a1a2e;padding:40px;border-radius:16px;border:1px solid #2a2a4a;'>"
    "<h1 style='color:#fff;font-size:24px;font-weight:800;text-align:center;margin:0 0 24px;'>r u good? AI</h1>"
    "<h2 style='color:#fff;font-size:20px;text-align:center;margin-bottom:8px;'>Verify Your Email</h2>"
    "<p style='color:#9ca3af;text-align:center;font-size:14px;margin-bottom:32px;'>This is a test email. Your code would be:</p>"
    "<div style='background:#0f0f1e;border:1px solid #2a2a4a;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;'>"
    "<p style='color:#fff;font-size:40px;font-weight:900;letter-spacing:12px;margin:0;font-family:monospace;'>"
    + code +
    "</p></div>"
    "<p style='color:#4b5563;font-size:11px;text-align:center;'>r u good? AI - TEST</p>"
    "</div></body></html>"
)
msg.attach(MIMEText(html_content, 'html'))

try:
    print(f"\nConnecting to {smtp_host}:{smtp_port}...")
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.set_debuglevel(1)   # <-- shows full SMTP conversation
    server.starttls()
    print("Logging in...")
    server.login(smtp_user, smtp_pass)
    print("Sending message...")
    server.send_message(msg)
    server.quit()
    print(f"\n[SUCCESS] Verification test email sent to {to_email}!")
except Exception as e:
    import traceback
    print(f"\n[FAILED] Error: {e}")
    traceback.print_exc()
