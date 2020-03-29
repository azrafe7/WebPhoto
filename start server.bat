@echo off
echo Starting HTTP server for webphoto...

REM for python 2.x
REM python -m SimpleHTTPServer

REM for python 3.x
python -m http.server
