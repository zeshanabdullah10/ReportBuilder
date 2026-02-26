@echo off
setlocal EnableDelayedExpansion

:: ============================================================================
:: PDF Generator for LabVIEW Report Builder
:: ============================================================================
:: Usage: generate-pdf.bat <html_file> <json_file> <output_pdf>
:: Example: generate-pdf.bat report.html report_data.json output.pdf
::
:: Requirements: PowerShell (built into Windows 7+)
:: ============================================================================

:: Check arguments
if "%~3"=="" (
    echo Usage: generate-pdf.bat ^<html_file^> ^<json_file^> ^<output_pdf^>
    echo Example: generate-pdf.bat report.html report_data.json output.pdf
    exit /b 1
)

set "HTML_FILE=%~1"
set "JSON_FILE=%~2"
set "OUTPUT_PDF=%~3"

:: Get absolute paths
for %%i in ("%HTML_FILE%") do set "HTML_FILE=%%~fi"
for %%i in ("%JSON_FILE%") do set "JSON_FILE=%%~fi"
for %%i in ("%OUTPUT_PDF%") do set "OUTPUT_PDF=%%~fi"

:: Get directory containing the files (for server root)
for %%i in ("%HTML_FILE%") do set "SERVER_ROOT=%%~dpi"

:: Get filenames only
for %%i in ("%HTML_FILE%") do set "HTML_NAME=%%~nxi"
for %%i in ("%JSON_FILE%") do set "JSON_NAME=%%~nxi"

:: Check if files exist
if not exist "%HTML_FILE%" (
    echo Error: HTML file not found: %HTML_FILE%
    exit /b 1
)

if not exist "%JSON_FILE%" (
    echo Error: JSON file not found: %JSON_FILE%
    exit /b 1
)

echo.
echo ========================================
echo PDF Generator for LabVIEW Report Builder
echo ========================================
echo HTML: %HTML_NAME%
echo JSON: %JSON_NAME%
echo Output: %OUTPUT_PDF%
echo ========================================
echo.

:: ============================================================================
:: Step 1: Find available port
:: ============================================================================
echo [1/5] Finding available port...
set "PORT=8080"
set "MAX_PORT=8100"

:find_port
netstat -an | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    set /a PORT+=1
    if !PORT! gtr %MAX_PORT% (
        echo Error: Could not find available port between 8080 and %MAX_PORT%
        exit /b 1
    )
    goto find_port
)
echo       Found available port: %PORT%

:: ============================================================================
:: Step 2: Detect Chrome or Edge
:: ============================================================================
echo [2/5] Detecting browser...

set "CHROME_PATH="

:: Check Chrome in common locations
for %%p in (
    "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
    "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) do (
    if exist %%p (
        set "CHROME_PATH=%%~p"
        goto :browser_found
    )
)

:: Check Edge in common locations
for %%p in (
    "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
    "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) do (
    if exist %%p (
        set "CHROME_PATH=%%~p"
        goto :browser_found
    )
)

:: Check Chromium
for %%p in (
    "%LOCALAPPDATA%\Chromium\Application\chrome.exe"
    "%ProgramFiles%\Chromium\Application\chrome.exe"
) do (
    if exist %%p (
        set "CHROME_PATH=%%~p"
        goto :browser_found
    )
)

echo Error: Could not find Chrome or Edge browser
echo Please install Chrome or Edge to generate PDFs
exit /b 1

:browser_found
echo       Found: %CHROME_PATH%

:: ============================================================================
:: Step 3: Start PowerShell HTTP Server
:: ============================================================================
echo [3/5] Starting HTTP server on port %PORT%...

:: Create PowerShell script for HTTP server
set "PS_SCRIPT=%TEMP%\http-server-%PORT%.ps1"

echo $ErrorActionPreference = 'Stop' > "%PS_SCRIPT%"
echo $port = %PORT% >> "%PS_SCRIPT%"
echo $root = '%SERVER_ROOT:\=\\%' >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo $listener = New-Object System.Net.HttpListener >> "%PS_SCRIPT%"
echo $listener.Prefixes.Add("http://localhost:$port/") >> "%PS_SCRIPT%"
echo $listener.Start() >> "%PS_SCRIPT%"
echo Write-Host "Server started on port $port" >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo # Serve index.html for root requests >> "%PS_SCRIPT%"
echo $defaultFile = '%HTML_NAME%' >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo while ($listener.IsListening) { >> "%PS_SCRIPT%"
echo     try { >> "%PS_SCRIPT%"
echo         $context = $listener.GetContext() >> "%PS_SCRIPT%"
echo         $request = $context.Request >> "%PS_SCRIPT%"
echo         $response = $context.Response >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo         # Determine file to serve >> "%PS_SCRIPT%"
echo         $urlPath = $request.Url.AbsolutePath >> "%PS_SCRIPT%"
echo         if ($urlPath -eq '/' -or $urlPath -eq '') { >> "%PS_SCRIPT%"
echo             $urlPath = '/' + $defaultFile >> "%PS_SCRIPT%"
echo         } >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo         $filePath = Join-Path $root $urlPath.TrimStart('/') >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo         if (Test-Path $filePath -PathType Leaf) { >> "%PS_SCRIPT%"
echo             # Determine content type >> "%PS_SCRIPT%"
echo             $extension = [System.IO.Path]::GetExtension($filePath).ToLower() >> "%PS_SCRIPT%"
echo             $contentTypes = @{ >> "%PS_SCRIPT%"
echo                 '.html' = 'text/html' >> "%PS_SCRIPT%"
echo                 '.htm' = 'text/html' >> "%PS_SCRIPT%"
echo                 '.css' = 'text/css' >> "%PS_SCRIPT%"
echo                 '.js' = 'application/javascript' >> "%PS_SCRIPT%"
echo                 '.json' = 'application/json' >> "%PS_SCRIPT%"
echo                 '.png' = 'image/png' >> "%PS_SCRIPT%"
echo                 '.jpg' = 'image/jpeg' >> "%PS_SCRIPT%"
echo                 '.jpeg' = 'image/jpeg' >> "%PS_SCRIPT%"
echo                 '.gif' = 'image/gif' >> "%PS_SCRIPT%"
echo                 '.svg' = 'image/svg+xml' >> "%PS_SCRIPT%"
echo                 '.ico' = 'image/x-icon' >> "%PS_SCRIPT%"
echo                 '.woff' = 'font/woff' >> "%PS_SCRIPT%"
echo                 '.woff2' = 'font/woff2' >> "%PS_SCRIPT%"
echo                 '.ttf' = 'font/ttf' >> "%PS_SCRIPT%"
echo             } >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo             $contentType = $contentTypes[$extension] >> "%PS_SCRIPT%"
echo             if (-not $contentType) { $contentType = 'application/octet-stream' } >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo             $buffer = [System.IO.File]::ReadAllBytes($filePath) >> "%PS_SCRIPT%"
echo             $response.ContentLength64 = $buffer.Length >> "%PS_SCRIPT%"
echo             $response.ContentType = $contentType >> "%PS_SCRIPT%"
echo             $response.StatusCode = 200 >> "%PS_SCRIPT%"
echo             $response.OutputStream.Write($buffer, 0, $buffer.Length) >> "%PS_SCRIPT%"
echo         } else { >> "%PS_SCRIPT%"
echo             $response.StatusCode = 404 >> "%PS_SCRIPT%"
echo             $notFound = [System.Text.Encoding]::UTF8.GetBytes('Not Found') >> "%PS_SCRIPT%"
echo             $response.ContentLength64 = $notFound.Length >> "%PS_SCRIPT%"
echo             $response.OutputStream.Write($notFound, 0, $notFound.Length) >> "%PS_SCRIPT%"
echo         } >> "%PS_SCRIPT%"
echo         $response.Close() >> "%PS_SCRIPT%"
echo     } catch { >> "%PS_SCRIPT%"
echo         # Ignore errors (server stopping, etc.) >> "%PS_SCRIPT%"
echo     } >> "%PS_SCRIPT%"
echo } >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo $listener.Stop() >> "%PS_SCRIPT%"
echo $listener.Close() >> "%PS_SCRIPT%"

:: Start PowerShell server in background
start /b powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%PS_SCRIPT%"
set "SERVER_PID=%errorlevel%"

:: Wait for server to be ready (check up to 10 times)
set "RETRIES=0"
:wait_for_server
set /a RETRIES+=1
if %RETRIES% gtr 10 (
    echo Error: Server failed to start
    taskkill /f /im powershell.exe >nul 2>&1
    exit /b 1
)

:: Use PowerShell to test connection
powershell -Command "try { $null = Invoke-WebRequest -Uri 'http://localhost:%PORT%/' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 1 /nobreak >nul
    goto wait_for_server
)

echo       Server started successfully

:: ============================================================================
:: Step 4: Generate PDF with Chrome headless
:: ============================================================================
echo [4/5] Generating PDF...

:: Build the URL with JSON file as query parameter for the runtime to use
set "URL=http://localhost:%PORT%/%HTML_NAME%?data=%JSON_NAME%"

:: Create output directory if it doesn't exist
for %%i in ("%OUTPUT_PDF%") do set "OUTPUT_DIR=%%~dpi"
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%" 2>nul

:: Run Chrome headless
"%CHROME_PATH%" --headless=new --disable-gpu --disable-software-rasterizer --no-pdf-header-footer --print-to-pdf="%OUTPUT_PDF%" "%URL%" 2>nul

if %errorlevel% neq 0 (
    echo Error: PDF generation failed
    goto cleanup
)

:: Wait for PDF file to be created (Chrome writes async)
set "PDF_RETRIES=0"
:wait_for_pdf
set /a PDF_RETRIES+=1
if %PDF_RETRIES% gtr 30 (
    echo Error: PDF file was not created
    goto cleanup
)

if not exist "%OUTPUT_PDF%" (
    timeout /t 1 /nobreak >nul
    goto wait_for_pdf
)

echo       PDF created: %OUTPUT_PDF%

:: ============================================================================
:: Step 5: Cleanup
:: ============================================================================
:cleanup
echo [5/5] Cleaning up...

:: Kill PowerShell server processes for this port
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq powershell.exe" /fo list ^| findstr "PID:"') do (
    taskkill /pid %%i /f >nul 2>&1
)

:: Delete temporary PowerShell script
if exist "%PS_SCRIPT%" del "%PS_SCRIPT%" >nul 2>&1

echo       Cleanup complete

:: Final status
if exist "%OUTPUT_PDF%" (
    echo.
    echo ========================================
    echo SUCCESS: PDF generated successfully!
    echo ========================================
    echo Output: %OUTPUT_PDF%
    for %%i in ("%OUTPUT_PDF%") do echo Size: %%~zi bytes
    echo ========================================
    exit /b 0
) else (
    echo.
    echo ========================================
    echo FAILED: PDF could not be generated
    echo ========================================
    exit /b 1
)
