<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Password Reset Successful</title>
    <style>
        @media only screen and (max-width: 600px) {
            .inner-body {
                width: 100% !important;
            }
            .footer {
                width: 100% !important;
            }
        }

        @media only screen and (max-width: 500px) {
            .button {
                width: 100% !important;
            }
        }
    </style>
</head>
<body style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -webkit-text-size-adjust: none; background-color: #ffffff; color: #718096; height: 100%; line-height: 1.4; margin: 0; padding: 0; width: 100% !important;">
    <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; background-color: #edf2f7; margin: 0; padding: 0; width: 100%;">
        <tr>
            <td align="center" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;">
                <table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; margin: 0; padding: 0; width: 100%;">
                    <!-- Logo Outside -->
                    <tr>
                        <td align="center" style="padding: 25px 0 15px;">
                            <table width="100px" height="100px" cellpadding="0" cellspacing="0" role="presentation" style="border-radius: 50%; background-color: #ffffff; border: 2px solid #e5e7eb; margin: 0 auto; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); z-index: 2; position: relative;">
                                <tr>
                                    <td align="center" valign="middle">
                                        <img src="{{ asset('./AceLogo.png') }}" alt="Ace Medical Center" style="width: 80px; height: auto; border-radius: 50%; object-fit: contain;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td class="body" width="100%" cellpadding="0" cellspacing="0" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; background-color: #edf2f7; border-bottom: 1px solid #edf2f7; border-top: 1px solid #edf2f7; margin: 0; padding: 0 0 32px 0; width: 100%;">
                            <table class="inner-body" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 570px; background-color: #ffffff; border-color: #e8e5ef; border-radius: 8px; border-width: 1px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); margin: 0 auto; padding: 0; width: 570px; margin-top: -40px;">
                                <tr>
                                    <td class="content-cell" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; max-width: 100vw; padding: 32px;">
                                        <!-- Top Space for Logo Overlap -->
                                        <div style="height: 40px;"></div>

                                        <!-- Greeting -->
                                        <h1 style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; color: #1f2937; font-size: 22px; font-weight: bold; margin-top: 0; text-align: center; letter-spacing: -0.025em;">
                                            Password Reset Successfully
                                        </h1>

                                        <!-- Message -->
                                        <p style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; font-size: 16px; line-height: 1.6em; margin-top: 16px; text-align: left; color: #4b5563;">
                                            Hi {{ $user->name }},
                                        </p>

                                        <p style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; font-size: 16px; line-height: 1.6em; margin-top: 16px; text-align: left; color: #4b5563;">
                                            Your password has been successfully reset. You can now sign in to your account using your new password.
                                        </p>

                                        <!-- Security Info -->
                                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 28px; background-color: #f9fafb; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                                            <tr>
                                                <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; background-color: #f3f4f6;">
                                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #374151;">Reset Information</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 16px 20px;">
                                                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #4b5563;">
                                                        <span style="display: inline-block; width: 120px; color: #6b7280;">Date & Time:</span>
                                                        <span style="font-weight: 500;">{{ now()->format('F j, Y, g:i a') }}</span>
                                                    </p>
                                                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #4b5563;">
                                                        <span style="display: inline-block; width: 120px; color: #6b7280;">Account:</span>
                                                        <span style="font-weight: 500;">{{ $user->email }}</span>
                                                    </p>
                                                    <p style="margin: 0; font-size: 14px; color: #4b5563;">
                                                        <span style="display: inline-block; width: 120px; color: #6b7280;">IP Address:</span>
                                                        <span style="font-weight: 500;">{{ request()->ip() }}</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Warning -->
                                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 28px; border-left: 4px solid #ef4444; background-color: #fef2f2; border-radius: 0 6px 6px 0;">
                                            <tr>
                                                <td style="padding: 16px 20px;">
                                                    <p style="margin: 0; font-size: 15px; color: #b91c1c; font-weight: bold;">Did not request this change?</p>
                                                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #7f1d1d; line-height: 1.6;">
                                                        If you did not request this password reset, your account may be compromised. Please contact our support team immediately at <a href="mailto:support@acemedicalcenter.com" style="color: #dc2626; text-decoration: underline; font-weight: 500;">support@acemedicalcenter.com</a> or call (078) 123-4567.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Tips Box -->
                                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 28px; background-color: #ecfdf5; border-radius: 6px; border: 1px solid #d1fae5;">
                                            <tr>
                                                <td style="padding: 16px 20px;">
                                                    <p style="margin: 0 0 8px 0; font-size: 15px; color: #065f46; font-weight: 600;">Password Security Tips</p>
                                                    <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: #047857; line-height: 1.6;">
                                                        <li style="margin-bottom: 4px;">Use a unique password for each website you visit</li>
                                                        <li style="margin-bottom: 4px;">Include uppercase letters, numbers, and symbols</li>
                                                        <li style="margin-bottom: 4px;">Avoid using personal information in your passwords</li>
                                                        <li>Consider using a password manager for better security</li>
                                                    </ul>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Salutation -->
                                        <p style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; font-size: 16px; line-height: 1.5em; margin-top: 28px; text-align: left; color: #4b5563;">
                                            Regards,<br>
                                            <span style="font-weight: 500;">The Ace Medical Center Team</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;">
                            <table class="footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 570px; margin: 0 auto; padding: 0; text-align: center; width: 570px;">
                                <tr>
                                    <td class="content-cell" align="center" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; max-width: 100vw; padding: 32px 20px;">
                                        <p style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; line-height: 1.5em; margin-top: 0; color: #9ca3af; font-size: 13px; text-align: center;">
                                            © {{ date('Y') }} Ace Medical Center. All rights reserved.
                                        </p>
                                        <p style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; line-height: 1.5em; margin-top: 12px; color: #9ca3af; font-size: 12px; text-align: center;">
                                            <a href="{{ url('/terms') }}" style="color: #9ca3af; text-decoration: underline;">Terms</a> •
                                            <a href="{{ url('/privacy') }}" style="color: #9ca3af; text-decoration: underline;">Privacy</a> •
                                            <a href="{{ url('/contact') }}" style="color: #9ca3af; text-decoration: underline;">Contact</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
