Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path public\icons | Out-Null

$srcPath = Resolve-Path public\images\undip-logo.png
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Generate-Icon($size, $padRatio, $outName, $bgHex) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($bgHex) {
        $color = [System.Drawing.ColorTranslator]::FromHtml($bgHex)
        $brush = New-Object System.Drawing.SolidBrush($color)
        $g.FillRectangle($brush, 0, 0, $size, $size)
        $brush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $pad = [int]($size * $padRatio)
    $availW = $size - (2 * $pad)
    $availH = $size - (2 * $pad)

    $scale = [Math]::Min($availW / $srcImg.Width, $availH / $srcImg.Height)
    $drawW = [int]($srcImg.Width * $scale)
    $drawH = [int]($srcImg.Height * $scale)
    $x = [int](($size - $drawW) / 2)
    $y = [int](($size - $drawH) / 2)

    $g.DrawImage($srcImg, $x, $y, $drawW, $drawH)
    $g.Dispose()

    $outPath = Join-Path 'public\icons' $outName
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated $outPath"
}

Generate-Icon 192 0.05 'icon-192.png' $null
Generate-Icon 512 0.05 'icon-512.png' $null
Generate-Icon 192 0.15 'icon-maskable-192.png' '#0f294a'
Generate-Icon 512 0.15 'icon-maskable-512.png' '#0f294a'
Generate-Icon 180 0.08 'apple-touch-icon.png' '#ffffff'

$srcImg.Dispose()
