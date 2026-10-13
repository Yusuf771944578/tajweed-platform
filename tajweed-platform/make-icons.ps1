Add-Type -AssemblyName System.Drawing
function New-Icon($size,$out){
  $bmp=New-Object System.Drawing.Bitmap($size,$size)
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode='AntiAlias'
  $u=$size/512.0
  $g.Clear([System.Drawing.Color]::FromArgb(11,16,32))
  $em=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16,185,129))
  $g.FillEllipse($em,[float](256*$u-150*$u),[float](256*$u-150*$u),[float](300*$u),[float](300*$u))
  $gold=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(251,191,36))
  $g.FillEllipse($gold,[float](256*$u-20*$u),[float](168*$u-20*$u),[float](40*$u),[float](40*$u))
  $wh=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $g.FillRectangle($wh,[float](176*$u),[float](216*$u),[float](74*$u),[float](120*$u))
  $g.FillRectangle($wh,[float](262*$u),[float](216*$u),[float](74*$u),[float](120*$u))
  $dk=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(11,16,32))
  $g.FillRectangle($dk,[float](250*$u),[float](216*$u),[float](12*$u),[float](120*$u))
  $bmp.Save($out,[System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose();$bmp.Dispose();$em.Dispose();$gold.Dispose();$wh.Dispose();$dk.Dispose()
}
$root=$PSScriptRoot
New-Icon 192 (Join-Path $root 'assets/icons/icon-192.png')
New-Icon 512 (Join-Path $root 'assets/icons/icon-512.png')
New-Icon 180 (Join-Path $root 'assets/icons/icon-180.png')
