$node = (Get-Command node).Source
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c cd /d C:\print-relay && `"$node`" --env-file=.env relay.mjs >> relay.log 2>&1"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName PrintRelay -Action $action -Trigger (New-ScheduledTaskTrigger -AtStartup) -Settings $settings -Principal $principal -Force
Start-ScheduledTask PrintRelay