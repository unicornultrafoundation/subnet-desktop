param (
    [switch] $SkipWSL
)

$InformationPreference = 'Continue'

Write-Information 'Subnet Desktop development environment setup complete.'

if (! (Get-Command wsl -ErrorAction SilentlyContinue) -and !$SkipWSL) {
    Write-Information 'installing wsl.... This will require a restart'

    $targetDir = (Join-Path ([System.IO.Path]::GetTempPath()) rdinstall)
    New-Item -ItemType Directory -Force -Path $targetDir

    $files = ("install-wsl.ps1", "restart-helpers.ps1", "sudo-install-wsl.ps1", "uninstall-wsl.ps1")
    foreach ($file in $files) {
        $url = "https://raw.githubusercontent.com/unicornultrafoundation/subnet-desktop/main/scripts/windows/$file"
        $outFile = (Join-Path $targetDir $file)
        Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $outFile
    }

    $sudoPath = (Join-Path $targetDir sudo-install-wsl.ps1)
    & $sudoPath -Step "EnableWSL-01"
}