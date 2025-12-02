<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Critical Resource Alert</title>
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
        .content {
            background: #f9fafb;
            padding: 20px;
            border: 1px solid #e5e7eb;
        }
        .alert-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 4px solid #dc2626;
        }
        .alert-item h4 {
            margin: 0 0 10px 0;
            color: #dc2626;
        }
        .alert-item p {
            margin: 5px 0;
        }
        .summary {
            background: #fef2f2;
            border: 2px solid #dc2626;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
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
    <div class="header">
        <h1>🚨 HSI Critical Alert</h1>
        <p>{{ $hospital->name }}</p>
    </div>
    
    <div class="content">
        <div class="summary">
            <h2 style="margin: 0; color: #dc2626;">{{ count($alerts) }} Critical Resource Alert(s)</h2>
            <p style="margin: 10px 0 0 0;">Immediate attention required</p>
        </div>
        
        <h3>Critical Resources:</h3>
        
        @foreach($alerts as $alert)
            <div class="alert-item">
                @if($alert['type'] === 'resource')
                    <h4>📦 {{ ucfirst(str_replace('_', ' ', $alert['category'])) }}</h4>
                    <p><strong>Survival Hours:</strong> {{ number_format($alert['survival_hours'], 1) }} hours</p>
                    @if(isset($alert['surge_hours']))
                        <p><strong>Surge Mode Hours:</strong> {{ number_format($alert['surge_hours'], 1) }} hours</p>
                    @endif
                @else
                    <h4>🛢️ {{ ucfirst(str_replace('_', ' ', $alert['tank_type'])) }} Tank</h4>
                    <p><strong>Current Level:</strong> {{ number_format($alert['current_level_percent'], 1) }}%</p>
                    @if(isset($alert['hours_remaining']))
                        <p><strong>Hours Remaining:</strong> {{ number_format($alert['hours_remaining'], 1) }} hours</p>
                    @endif
                @endif
            </div>
        @endforeach
        
        <h3>Recommended Actions:</h3>
        <ul>
            <li>Review current inventory levels immediately</li>
            <li>Contact vendors with active MOUs for emergency resupply</li>
            <li>Consider activating disaster mode if situation warrants</li>
            <li>Update the HSI system with latest readings</li>
        </ul>
        
        <p><strong>Please log into the KALINGA system to take appropriate action.</strong></p>
    </div>
    
    <div class="footer">
        <p>This is an automated message from the KALINGA Hospital Safety Index System.<br>
        Generated at {{ $timestamp->format('F j, Y g:i A') }} (Philippine Time)</p>
    </div>
</body>
</html>
