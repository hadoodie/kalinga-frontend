<!DOCTYPE html>
<html>
<head>
    <title>Verification Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #991b1b;">Verification Unsuccessful</h2>
        
        <p>Hello {{ $user->name }},</p>
        
        <p>We reviewed your identity documents, but unfortunately, we could not verify your account at this time.</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <strong>Reason:</strong><br>
            {{ $reason }}
        </div>

        <p>Please log in to try again. Ensure your ID photo is clear, readable, and not expired.</p>
        
        <p>Regards,<br>The Kalinga Team</p>
    </div>
</body>
</html>