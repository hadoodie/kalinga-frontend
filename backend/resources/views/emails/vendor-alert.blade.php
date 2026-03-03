<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Emergency Supply Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #dc2626;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .urgency-critical {
            background: #dc2626;
        }
        .urgency-warning {
            background: #f59e0b;
        }
        .content {
            background: #f9fafb;
            padding: 20px;
            border: 1px solid #e5e7eb;
        }
        .details {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .details table {
            width: 100%;
            border-collapse: collapse;
        }
        .details td {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .details td:first-child {
            font-weight: bold;
            color: #6b7280;
        }
        .action-required {
            background: #fef2f2;
            border: 2px solid #dc2626;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .footer {
            text-align: center;
            padding: 15px;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header {{ $urgency === 'CRITICAL' ? 'urgency-critical' : 'urgency-warning' }}">
        <h1>🚨 {{ $urgency }} - Emergency Supply Request</h1>
    </div>
    
    <div class="content">
        <p>Dear {{ $vendor->contact_person }},</p>
        
        <p>This is an <strong>automated emergency notification</strong> from <strong>{{ $hospital->name }}</strong> 
        through the KALINGA Hospital Safety Index System.</p>
        
        <div class="action-required">
            <h3 style="margin-top: 0; color: #dc2626;">⚠️ Immediate Action Required</h3>
            <p>Critical supply levels have dropped below safe thresholds. Per our Memorandum of Understanding 
            (Ref: {{ $vendor->mou_reference_number }}), we are requesting emergency resupply.</p>
        </div>
        
        <div class="details">
            <h3>Request Details</h3>
            <table>
                <tr>
                    <td>Resource Category:</td>
                    <td>{{ $resourceCategory }}</td>
                </tr>
                <tr>
                    <td>Current Survival Hours:</td>
                    <td><strong style="color: #dc2626;">{{ number_format($survivalHours, 1) }} hours</strong></td>
                </tr>
                <tr>
                    <td>HSI Minimum Required:</td>
                    <td>72 hours</td>
                </tr>
                <tr>
                    <td>Requested Quantity:</td>
                    <td><strong>{{ $autoOrderQuantity }} {{ $autoOrderUnit }}</strong></td>
                </tr>
                <tr>
                    <td>Response Required Within:</td>
                    <td>{{ $vendor->guaranteed_response_hours }} hours</td>
                </tr>
            </table>
        </div>
        
        <div class="details">
            <h3>Hospital Information</h3>
            <table>
                <tr>
                    <td>Hospital Name:</td>
                    <td>{{ $hospital->name }}</td>
                </tr>
                <tr>
                    <td>Address:</td>
                    <td>{{ $hospital->address }}</td>
                </tr>
                <tr>
                    <td>Contact:</td>
                    <td>{{ $hospital->contact }} / {{ $hospital->contact_number }}</td>
                </tr>
                <tr>
                    <td>Email:</td>
                    <td>{{ $hospital->email }}</td>
                </tr>
            </table>
        </div>
        
        <p><strong>Please confirm receipt of this request and provide an estimated delivery time.</strong></p>
        
        <p>For urgent coordination, please contact the hospital directly or respond to this email.</p>
        
        <p>Thank you for your prompt attention to this critical matter.</p>
        
        <p>Best regards,<br>
        <strong>KALINGA Emergency Logistics System</strong></p>
    </div>
    
    <div class="footer">
        <p>This is an automated message from the KALINGA Hospital Safety Index System.<br>
        Generated at {{ now()->format('F j, Y g:i A') }} (Philippine Time)</p>
        <p>MOU Reference: {{ $vendor->mou_reference_number }}</p>
    </div>
</body>
</html>
