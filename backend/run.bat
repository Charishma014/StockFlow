@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.12"
cd /d "%~dp0"
"%JAVA_HOME%\bin\java.exe" -Dspring.devtools.restart.enabled=false -cp "@classpath.args" com.stockflow.stockflow.StockflowApplication
