$path = "src/components/ClientSwipeContainer.tsx"
$content = Get-Content $path -Raw
# Match role="owner", then spaces/newlines, then />, then spaces/newlines, then )}
$pattern = 'role="owner"\s*/>\s*\)}'
$content = [regex]::Replace($content, $pattern, 'role="owner" /> ) : null}')
Set-Content $path $content -NoNewline
