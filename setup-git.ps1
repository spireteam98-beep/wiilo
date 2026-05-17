# =============================================================
# setup-git.ps1
# One-shot: initialize git in this folder, exclude secrets,
# connect to https://github.com/spireteam98-beep/wiilo, push.
#
# How to run:
#   1) Right-click this file → Run with PowerShell
#      (or open PowerShell, cd into this folder, then: .\setup-git.ps1)
#   2) When git asks you to authenticate to GitHub, sign in with
#      the spireteam98-beep account in the browser window that opens.
# =============================================================

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "==> Working in: $PSScriptRoot" -ForegroundColor Cyan

# --- 1. Make sure git is installed ---------------------------
try { git --version | Out-Null }
catch {
  Write-Host "Git is not installed. Download it from https://git-scm.com/download/win and re-run this script." -ForegroundColor Red
  exit 1
}

# --- 2. Remove any half-initialized .git folder --------------
if (Test-Path ".\.git") {
  Write-Host "==> Removing stale .git folder" -ForegroundColor Yellow
  # OneDrive sometimes locks files; retry briefly
  for ($i = 0; $i -lt 5; $i++) {
    try {
      Remove-Item -Recurse -Force ".\.git"
      break
    } catch {
      Start-Sleep -Milliseconds 400
    }
  }
}

# --- 3. Safety check: confirm the Firebase admin key is gitignored ---
$gitignore = Get-Content ".\.gitignore" -Raw -ErrorAction SilentlyContinue
$needsAppend = $false
$secretsPatterns = @(
  "*firebase-adminsdk*.json",
  "*serviceAccountKey*.json",
  "_env_test.txt",
  "*.pem",
  "*.key",
  "gittoken*.txt"
)
foreach ($p in $secretsPatterns) {
  if ($gitignore -notmatch [regex]::Escape($p)) { $needsAppend = $true; break }
}
if ($needsAppend) {
  Write-Host "==> Adding secret-file patterns to .gitignore" -ForegroundColor Yellow
  Add-Content ".\.gitignore" "`n# Added by setup-git.ps1`n*firebase-adminsdk*.json`n*serviceAccountKey*.json`n_env_test.txt`n*.pem`n*.key`ngittoken*.txt`n"
}

# --- 4. Initialize repo --------------------------------------
Write-Host "==> git init (branch: main)" -ForegroundColor Cyan
git init -b main | Out-Null

git config user.name  "spireteam98-beep"
git config user.email "spireteam98@gmail.com"

# --- 5. Set remote (or update if it already exists) ----------
$remote = "https://github.com/spireteam98-beep/wiilo.git"
$existing = git remote 2>$null
if ($existing -contains "origin") {
  git remote set-url origin $remote
} else {
  git remote add origin $remote
}
Write-Host "==> remote 'origin' set to: $remote" -ForegroundColor Cyan

# --- 6. Stage everything (respecting .gitignore) -------------
Write-Host "==> Staging files" -ForegroundColor Cyan
git add -A

# Hard guard: refuse to commit if a secret slipped through
$staged = git diff --cached --name-only
$danger = $staged | Where-Object {
  $_ -match "firebase-adminsdk" -or
  $_ -match "serviceAccountKey" -or
  $_ -match "^\.env(\.|$)"      -or
  $_ -match "gittoken"
}
if ($danger) {
  Write-Host "ABORT — these secret-looking files are staged. Fix .gitignore and re-run:" -ForegroundColor Red
  $danger | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
  exit 1
}

# --- 7. First commit ----------------------------------------
git commit -m "Initial commit: wiillo project" | Out-Host

# --- 8. Push -------------------------------------------------
Write-Host "==> Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "   (If a browser window opens, sign in as spireteam98-beep)" -ForegroundColor Gray
git push -u origin main

Write-Host "`nDone. Repo is live at https://github.com/spireteam98-beep/wiilo" -ForegroundColor Green
