import asyncio
from pathlib import Path

import aiofiles
from aiohttp import WSMsgType, web

from .reporter import get_task_report


class AvServer:

    def __init__(self):
        self.server = web.Application()
        self.server.add_routes([
            web.get('/sources', self._handle_get_source),
            web.get('/ws', self._handle_websocket_connection),
            web.static('/static', Path(__file__).resolve().parent.parent / 'web')
        ])

        self.ws = None

    async def _handle_get_source(self, request):
        '''Returns a requested filepath as plaintext.
        Yes, this is wildly unsafe to use anywhere but locally as it can return any file on the disk.
        '''
        async with aiofiles.open(request.query['filepath'], mode='r') as f:
            source = await f.read()

        return web.Response(text=source)

    async def _handle_websocket_connection(self, request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        # Assign the websocket connection handler so other coroutines can send messages.
        self.ws = ws

        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                if msg.data == 'close':
                    await ws.close()
            elif msg.type == WSMsgType.ERROR:
                print('WebSocket connection closed with exception {}'.format(ws.exception()))
                self.ws = None

        # Clean up when websocket connection closes.
        self.ws = None
        return ws

    async def _send_asyncio_tasks_state(self):
        '''If the websocket connection exists, evaluate and send asyncio tasks state.'''
        while True:
            if self.ws is not None:
                await self.ws.send_json(get_task_report())
            await asyncio.sleep(1)


def start_server(port=8080):
    '''Set up the http and WebSocket servers.
    The main program that's using aioviewer is responsible for preventing the application from exiting.
    '''
    server = AvServer()

    loop = asyncio.get_event_loop()

    runner = web.AppRunner(server.server)
    loop.run_until_complete(runner.setup())
    site = web.TCPSite(runner, host='localhost', port=port)
    loop.run_until_complete(site.start())

    asyncio.ensure_future(server._send_asyncio_tasks_state())
