<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Password Changed</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background-color: #f8f9fa;
            color: #343a40;
            padding: 40px;
        }
        .container {
            background-color: white;
            max-width: 600px;
            margin: auto;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
        }
        h2 {
            color: #007bff;
        }
        .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        {{-- <h2>Password Change Confirmation</h2> --}}
        <p>Hi {{ $user->name }},</p>

        <p>This is a confirmation that your password was successfully changed.</p>

        <p>If you did not make this change, please <strong>contact our support team immediately</strong>.</p>

        <p>Thank you for keeping your account secure!</p>

        <div class="footer">
            &mdash; The {{ config('app.name') }} Team
        </div>
    </div>
</body>
</html>
