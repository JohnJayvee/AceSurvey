<!DOCTYPE html>
<html>
<head>
    <title>Email Address Changed</title>
</head>
<body>
    <p>Dear {{ $user->name }},</p>
    <p>Your email address has been successfully changed to {{ $user->email }}.</p>
    <p>If you did not request this change, please contact our support team immediately.</p>
    <p>Thank you,</p>
    <p>Ace Medical Center Tuguegarao</p>
</body>
</html>
