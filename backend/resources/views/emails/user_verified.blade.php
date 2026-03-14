<!DOCTYPE html>
<html>
<head>
    <title>Account Verified</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #166534;">You are verified!</h2>
        
        <p>Hello {{ $user->name }},</p>
        
        <p>Great news! Your identity verification documents have been reviewed and <strong>approved</strong>.</p>
        <p>You now have full access to the Kalinga Patient Portal. You can book appointments, view your records, and request assistance.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url', 'http://localhost:4000') }}/magic-login?token={{ urlencode($token) }}&role={{ urlencode($user->role) }}" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Go to Dashboard
            </a>
        </div>

        <p>Stay safe,<br>The Kalinga Team</p>
    </div>
</body>
</html>