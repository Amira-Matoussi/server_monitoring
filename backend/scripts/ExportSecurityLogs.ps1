$supabaseUrl = "https://somtnihlenbxohqrmfbe.supabase.co/rest/v1/event_logs"
$supabaseApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbXRuaWhsZW5ieG9ocXJtZmJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjI5MDM0OSwiZXhwIjoyMDYxODY2MzQ5fQ.9YIOqt0WkYNNsJdZP6Mfn-IlATFVfghzHubANqjG7Eg"


# Number of events to fetch
$maxEvents = 100
# Event log to read from
$logName = "Security"

# Fetch events
$events = Get-WinEvent -LogName $logName -MaxEvents $maxEvents

function Convert-EventToSupabaseRecord {
    param($event)

    $message = if ($event.Message) {
        $event.Message.Split("`n")[0].Trim()
    } else {
        ""
    }

    Write-Host "Message: '$message'"

    return @{
        "ServerName"       = $env:COMPUTERNAME
        "Id"               = $event.Id
        "LevelDisplayName" = $event.LevelDisplayName
        "ProviderName"     = $event.ProviderName
        "Message"          = $message
        "is_threat"        = 0
        "created_at"       = (Get-Date).ToUniversalTime().ToString("o")
    }
}
# Prepare array for JSON payload
$records = @()
foreach ($evt in $events) {
    $record = Convert-EventToSupabaseRecord -event $evt
    $records += $record
}

# Convert records array to JSON
$jsonPayload = $records | ConvertTo-Json -Depth 5

# Setup HTTP headers
$headers = @{
    "apikey"        = $supabaseApiKey
    "Authorization" = "Bearer $supabaseApiKey"
    "Content-Type"  = "application/json"
    "Prefer"        = "resolution=merge-duplicates"
}

# Send data to Supabase REST API
$response = Invoke-RestMethod -Uri $supabaseUrl -Method Post -Headers $headers -Body $jsonPayload

Write-Host "Inserted $($records.Count) events into Supabase."
