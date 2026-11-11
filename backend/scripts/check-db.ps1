<#
  PoketHub 로컬 DB 확인 스크립트
  실행:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\check-db.ps1

  하는 일
    1) 테이블 9개 DESCRIBE
    2) 테이블 개수 + 기본값 확인 (task.status=TODO, task.priority=MEDIUM, pr.state=OPEN)
    3) ./gradlew bootRun 으로 DB 연결까지 기동되는지 확인 후 종료

  비밀번호 처리
    - 가려진 입력(Read-Host -AsSecureString)으로 한 번만 묻는다.
    - 파일·로그·명령줄 인자에 쓰지 않는다. mysql / bootRun 자식 프로세스의 환경변수로만 넘기고
      (MYSQL_PWD, DB_PASSWORD), 이 스크립트 자신의 환경변수에는 넣지 않는다.
    - 출력은 화면에만 찍고, 혹시 섞여 나와도 **** 로 가린다.
    - 끝나면 변수를 지운다. 위 명령처럼 별도 powershell 프로세스로 실행하면 끝날 때 메모리째 사라진다.
#>
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$Root    = Split-Path -Parent $PSScriptRoot
$MySql   = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$DbUser  = 'root'
$Tables  = 'user', 'repository', 'collaborator', 'task', 'pr', 'commit', 'file', 'review', 'refresh_token'
$BootTimeoutSec = 240

function Hide([string]$s) {
  if ($script:pw -and $s) { return $s.Replace($script:pw, '****') }
  return $s
}

function Start-Child([string]$file, [string]$arguments, [hashtable]$envs, [switch]$WithStdin) {
  $si = New-Object Diagnostics.ProcessStartInfo -ArgumentList $file, $arguments
  $si.UseShellExecute = $false
  $si.CreateNoWindow = $true
  $si.WorkingDirectory = $Root
  $si.RedirectStandardOutput = $true
  $si.RedirectStandardError = $true
  $si.RedirectStandardInput = [bool]$WithStdin
  $si.StandardOutputEncoding = [Text.Encoding]::UTF8
  $si.StandardErrorEncoding = [Text.Encoding]::UTF8
  foreach ($k in $envs.Keys) { $si.EnvironmentVariables[$k] = $envs[$k] }  # 이 자식 프로세스에만 전달
  return [Diagnostics.Process]::Start($si)
}

function Invoke-Sql([string]$sql) {
  # SQL 은 표준입력으로 보낸다 (명령줄에는 계정·DB 이름만)
  $p = Start-Child $MySql "-u $DbUser --table --force --default-character-set=utf8mb4 pockethub" @{ MYSQL_PWD = $script:pw } -WithStdin
  $p.StandardInput.Write($sql)
  $p.StandardInput.Close()
  $errTask = $p.StandardError.ReadToEndAsync()
  $out = $p.StandardOutput.ReadToEnd()
  $p.WaitForExit()
  $err = $errTask.Result
  if ($out) { Write-Host (Hide $out).TrimEnd() }
  if ($err) { Write-Host ("[mysql 오류] " + (Hide $err).Trim()) }
  return $p.ExitCode
}

$sec = Read-Host "MySQL $DbUser 비밀번호" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
try { $script:pw = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr); $sec.Dispose() }

try {
  Write-Host "===== PoketHub DB 확인 ($(Get-Date -Format 'yyyy-MM-dd HH:mm')) ====="

  # ---------- 0. 접속 ----------
  Write-Host "`n## 0. 접속 확인"
  $code = Invoke-Sql "SELECT VERSION() AS mysql_version, DATABASE() AS db;"
  if ($code -ne 0) { Write-Host "=> 접속 실패 (아래 단계도 실패할 수 있음)" }

  # ---------- 1. DESCRIBE ----------
  Write-Host "`n## 1. 테이블 DESCRIBE"
  foreach ($t in $Tables) {
    Write-Host "`n### $t"
    [void](Invoke-Sql "DESCRIBE ``$t``;")   # user·commit·file 은 예약어라 백틱으로 감싼다
  }

  # ---------- 2. 테이블 개수 · 기본값 ----------
  Write-Host "`n## 2. 테이블 개수 · 기본값"
  $inList = ($Tables | ForEach-Object { "'$_'" }) -join ','
  [void](Invoke-Sql @"
SELECT COUNT(*) AS found_tables, $($Tables.Count) AS expected
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = 'pockethub' AND TABLE_NAME IN ($inList);
SELECT c.TABLE_NAME, c.COLUMN_NAME, c.COLUMN_DEFAULT AS actual, e.expected,
       IF(c.COLUMN_DEFAULT <=> e.expected, 'OK', 'NG') AS result
  FROM (SELECT 'task' AS t, 'status' AS col, 'TODO' AS expected
        UNION ALL SELECT 'task', 'priority', 'MEDIUM'
        UNION ALL SELECT 'pr', 'state', 'OPEN') e
  LEFT JOIN information_schema.COLUMNS c
    ON c.TABLE_SCHEMA = 'pockethub' AND c.TABLE_NAME = e.t AND c.COLUMN_NAME = e.col
 ORDER BY e.t, e.col;
"@)

  # ---------- 3. bootRun ----------
  Write-Host "`n## 3. ./gradlew bootRun (DB 연결 확인, 최대 $BootTimeoutSec 초)"
  $p = Start-Child $env:ComSpec "/d /s /c `"`"$Root\gradlew.bat`" bootRun --no-daemon --console=plain 2>&1`"" @{ DB_USERNAME = $DbUser; DB_PASSWORD = $script:pw }
  [void]$p.StandardError.ReadToEndAsync()
  $lines = New-Object Collections.Generic.List[string]
  $deadline = (Get-Date).AddSeconds($BootTimeoutSec)
  $result = 'TIMEOUT'
  $pending = $p.StandardOutput.ReadLineAsync()
  while ((Get-Date) -lt $deadline) {
    if (-not $pending.Wait(1000)) { continue }
    $line = $pending.Result
    if ($null -eq $line) { $result = 'FAIL'; break }        # 기동 전에 프로세스가 끝남 = 실패
    $lines.Add((Hide $line))
    if ($line -match 'Started PockethubApplication') { $result = 'OK'; break }
    $pending = $p.StandardOutput.ReadLineAsync()
  }
  if (-not $p.HasExited) { & cmd.exe /d /c "taskkill /PID $($p.Id) /T /F >nul 2>&1" }  # 앱·Gradle 함께 종료

  $key = 'HikariPool|Database (info|version|driver|JDBC URL)|Tomcat started|Started PockethubApplication|APPLICATION FAILED|Description:|Reason:|Action:|Caused by|Exception|BUILD (SUCCESSFUL|FAILED)|error:'
  Write-Host "-- 주요 로그"
  $lines | Where-Object { $_ -cmatch $key -and $_ -notmatch '^\s+at ' } | Select-Object -First 25 | ForEach-Object { Write-Host $_ }
  if ($result -ne 'OK') {
    Write-Host "-- 마지막 로그 40줄"
    $lines | Select-Object -Last 40 | ForEach-Object { Write-Host $_ }
  }
  $connected = [bool]($lines | Where-Object { $_ -match 'HikariPool-1 - (Start completed|Added connection)' })
  Write-Host "`n=> bootRun: $result / DB 연결: $(if ($connected) { '성공' } else { '확인 안 됨' })"
  Write-Host "===== 끝 ====="
}
finally {
  $script:pw = $null
  Remove-Variable -Name pw -Scope Script -ErrorAction SilentlyContinue
  [GC]::Collect()
}
