# Starts Expo for physical phones on the same Wi-Fi
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..

$wifi = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -match 'Wi-Fi|WLAN|Ethernet' -and $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
  Sort-Object -Property @{ Expression = { if ($_.InterfaceAlias -match 'Wi-Fi') { 0 } else { 1 } } } |
  Select-Object -First 1

if (-not $wifi) { throw 'No LAN IPv4 found. Connect to Wi-Fi first.' }

$ip = $wifi.IPAddress
Write-Host "Using LAN IP: $ip ($($wifi.InterfaceAlias))"

$envPath = Join-Path (Get-Location) '.env'
$clientId = 'Ov23lixLhgjk1jI6MCYS'
if (Test-Path $envPath) {
  $existing = Get-Content $envPath -Raw
  if ($existing -match 'EXPO_PUBLIC_GITHUB_CLIENT_ID=([^\r\n]+)') {
    $clientId = $Matches[1].Trim()
  }
}

@"
EXPO_PUBLIC_API_URL=http://${ip}:3000
EXPO_PUBLIC_WS_URL=ws://${ip}:4000
EXPO_PUBLIC_GITHUB_CLIENT_ID=$clientId
"@ | Set-Content -Path $envPath -Encoding utf8

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip

# Best effort: allow phone to reach Metro/API/WS
foreach ($port in 3000, 4000, 8081) {
  $name = "Zenith-Collab-$port"
  if (-not (Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue)) {
    try {
      New-NetFirewallRule -DisplayName $name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port -ErrorAction Stop | Out-Null
      Write-Host "Firewall opened for port $port"
    } catch {
      Write-Host "Could not add firewall rule for $port (run as Admin if phone can't connect)"
    }
  }
}

Write-Host ""
Write-Host "1) Install Expo Go (Android 12+ / iOS 16.4+)"
Write-Host "2) Same Wi-Fi as this PC"
Write-Host "3) Scan the QR below"
Write-Host "API -> http://${ip}:3000"
Write-Host ""

npx expo start --lan --clear
