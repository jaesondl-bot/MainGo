param(
  [Parameter(Mandatory = $true)][string] $InputPath,
  [Parameter(Mandatory = $true)][string] $OutputPath,
  [Parameter(Mandatory = $true)][int] $Size
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $InputPath))
try {
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  $g.DrawImage($src, 0, 0, $Size, $Size)
  $dir = Split-Path -Parent $OutputPath
  if ($dir -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  if ($g) { $g.Dispose() }
  if ($bmp) { $bmp.Dispose() }
  $src.Dispose()
}
