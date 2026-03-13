import secrets
from datetime import datetime, timedelta
from typing import Optional


class PasswordResetService:
    """Service for handling password reset functionality."""
    
    @staticmethod
    def generate_reset_token() -> str:
        """Generate a secure random token for password reset."""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def is_token_expired(created_at: datetime, expiry_hours: int = 1) -> bool:
        """Check if a reset token has expired."""
        expiry_time = created_at + timedelta(hours=expiry_hours)
        return datetime.utcnow() > expiry_time
    
    @staticmethod
    async def send_reset_email(email: str, token: str, frontend_url: str) -> bool:
        """
        Send password reset email.
        
        For now, this is a mock implementation that logs the reset link.
        In production, integrate with SendGrid, Resend, or similar service.
        """
        reset_link = f"{frontend_url}/reset-password?token={token}"
        
        # Mock email - log to console
        print("\n" + "="*60)
        print("📧 PASSWORD RESET EMAIL")
        print("="*60)
        print(f"To: {email}")
        print(f"Subject: Reset Your DailyRoutine Password")
        print(f"\nClick the link below to reset your password:")
        print(f"\n{reset_link}")
        print(f"\nThis link expires in 1 hour.")
        print("="*60 + "\n")
        
        # TODO: Integrate real email service
        # Example with SendGrid:
        # from sendgrid import SendGridAPIClient
        # from sendgrid.helpers.mail import Mail
        # 
        # message = Mail(
        #     from_email='noreply@dailyroutine.com',
        #     to_emails=email,
        #     subject='Reset Your Password',
        #     html_content=f'<p>Click <a href="{reset_link}">here</a> to reset your password.</p>'
        # )
        # sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        # response = sg.send(message)
        
        return True


password_reset_service = PasswordResetService()
