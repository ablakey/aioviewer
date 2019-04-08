import asyncio
import inspect
from pathlib import Path

import aiofiles
from aiohttp import WSMsgType, web


class AioviewerServer:

    def __init__(self):
        self.server = web.Application()
        self.server.add_routes([
            web.get('/sources', self._handle_get_source),
            web.get('/ws', self._handle_websocket_connection),
            web.static('/static', Path(__file__).resolve().parent.parent / 'static')
        ])

        self._ws = None
        self._last_report = None

    def _produce_report(self):
        '''Returns a report of where each asyncio task is currently awaiting.'''

        report = []
        for t in asyncio.Task.all_tasks():
            # Ignore completed tasks. They get cleaned up.
            if t._coro.cr_frame is None:
                continue

            info = inspect.getframeinfo(t._coro.cr_frame)
            # String format for easy evaluation of if each has changed (both in Python and JS)
            report.append(f'{info[0]} {info[1]}')

        return sorted(report)

    async def _handle_get_source(self, request):
        '''Returns a requested filepath as plaintext.
        Yes, this is wildly unsafe to use anywhere but locally as it can return any file on the disk.
        '''
        async with aiofiles.open(request.query['filepath'], mode='r') as f:
            source = await f.read()

        return web.Response(text=source)

    async def _handle_websocket_connection(self, request):
        '''Handle a ws connection request.
        Because the relationship between the server and client is 1:1, a limit of one connection is enforced. This
        simplifies the server implementation but means that only one browser window can be open to aioviewer at a time.
        '''

        # Only allow a single connection at a time.
        if self._ws is not None:
            return

        ws = web.WebSocketResponse()
        await ws.prepare(request)

        # Assign the websocket connection handler to the class instance so other coroutines can send messages.
        self._ws = ws

        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                if msg.data == 'close':
                    await ws.close()
            elif msg.type == WSMsgType.ERROR:
                print('WebSocket connection closed with exception {}'.format(ws.exception()))
                self._ws = None

        # Clean up when websocket connection closes.
        self._ws = None
        return ws

    async def _send_asyncio_tasks_state(self):
        '''If the websocket connection exists, evaluate and send asyncio tasks state.'''
        while True:
            if self._ws is not None:
                # Produce a task status report. If it is different from the last, publish it.
                new_report = self._produce_report()
                if new_report != self._last_report:
                    await self._ws.send_json(new_report)
                    self._last_report = new_report
                    print('Changed.')
                else:
                    print('Unchanged.')
            await asyncio.sleep(1)


def start_server(port=8080):
    '''Set up the http and WebSocket servers.
    The main program that's using aioviewer is responsible for preventing the application from exiting.
    '''
    server = AioviewerServer()

    loop = asyncio.get_event_loop()

    runner = web.AppRunner(server.server)
    loop.run_until_complete(runner.setup())
    site = web.TCPSite(runner, host='localhost', port=port)
    loop.run_until_complete(site.start())

    asyncio.ensure_future(server._send_asyncio_tasks_state())
