# TODO

1. Write a webpage that connects to WS.
2. when WS message comes in, it sets to application state.
3. when application state mutates, if any files are missing, GET them.
4. for files not missing, update their highlighting by rendering the pre (or it's always rendered and we modify it)
5. when a GET file is callbacked, render it.

`GET http://localhost:8090/sources?filepath=/home/ablakey/myprojects/aioviewer/example.py`
