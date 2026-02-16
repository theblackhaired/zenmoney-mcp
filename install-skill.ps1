#!/usr/bin/env pwsh
# ZenMoney Skill Installation Script for Claude Code
# Run with: powershell -ExecutionPolicy Bypass -File install-skill.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 ZenMoney Skill Installer for Claude Code" -ForegroundColor Cyan
Write-Host ""

# Determine Claude skills directory
$claudeSkillsDir = Join-Path $env:USERPROFILE ".claude\skills"
$skillFile = "zenmoney.skill.md"
$skillPath = Join-Path $PSScriptRoot $skillFile
$targetPath = Join-Path $claudeSkillsDir $skillFile

# Check if skill file exists
if (-not (Test-Path $skillPath)) {
    Write-Host "❌ Error: $skillFile not found in current directory" -ForegroundColor Red
    exit 1
}

# Create skills directory if it doesn't exist
if (-not (Test-Path $claudeSkillsDir)) {
    Write-Host "📁 Creating Claude skills directory: $claudeSkillsDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $claudeSkillsDir | Out-Null
}

# Check if skill already installed
if (Test-Path $targetPath) {
    Write-Host "⚠️  Skill already installed at: $targetPath" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "❌ Installation cancelled" -ForegroundColor Red
        exit 0
    }
    Remove-Item $targetPath -Force
}

# Try to create symbolic link (requires admin on Windows)
Write-Host "🔗 Attempting to create symbolic link..." -ForegroundColor Yellow

try {
    # Check if running as administrator
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    if ($isAdmin) {
        New-Item -ItemType SymbolicLink -Path $targetPath -Target $skillPath -Force | Out-Null
        Write-Host "✅ Symbolic link created successfully!" -ForegroundColor Green
        Write-Host "   Target: $targetPath" -ForegroundColor Gray
        Write-Host "   Source: $skillPath" -ForegroundColor Gray
    } else {
        throw "Not running as administrator"
    }
} catch {
    Write-Host "⚠️  Cannot create symbolic link (requires admin privileges)" -ForegroundColor Yellow
    Write-Host "📋 Copying skill file instead..." -ForegroundColor Yellow
    Copy-Item $skillPath -Destination $targetPath -Force
    Write-Host "✅ Skill file copied successfully!" -ForegroundColor Green
    Write-Host "   Location: $targetPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Tip: Run as administrator to use symbolic links (auto-updates)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Make sure MCP server is built: npm run build" -ForegroundColor White
Write-Host "   2. Authorize with ZenMoney: npm run auth" -ForegroundColor White
Write-Host "   3. Restart Claude Code" -ForegroundColor White
Write-Host "   4. Try: 'Покажи мои счета в ZenMoney'" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Installation complete!" -ForegroundColor Green