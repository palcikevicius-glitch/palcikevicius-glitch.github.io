@echo off
chcp 65001 >nul
cd /d "%~dp0"
if exist Pupa.exe goto run
set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist "%CSC%" (
  echo Nerastas .NET Framework 4 kompiliatorius. Jis yra visuose Windows 10 ir 11.
  pause
  exit /b 1
)
echo Ruošiamas Pupa.exe (tik pirmą kartą)...
"%CSC%" /nologo /target:winexe /optimize+ /codepage:65001 /out:Pupa.exe /r:System.Windows.Forms.dll /r:System.Drawing.dll Pupa.cs
if errorlevel 1 (
  echo Nepavyko sukurti Pupa.exe.
  pause
  exit /b 1
)
:run
start "" "%~dp0Pupa.exe"
