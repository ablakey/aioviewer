import asyncio
import time

import requests
from aiohttp import web

import aioviewer

loop = asyncio.get_event_loop()


class AioviewerExample:

    def __init__(self):
        self.started = time.time()
        self.server = web.Application(debug=True)
        self.server.add_routes([web.get('/example', self.handle_http_request)])

    async def report_uptime(self):
        while True:
            await asyncio.sleep(5)
            delta = time.time() - self.started
            print('Been running for {} seconds.'.format(delta))

    async def make_http_request(self):
        while True:
            response = await loop.run_in_executor(None, requests.get, 'http://localhost:8081/example')
            await asyncio.sleep(1)
            print(response.text)
            await asyncio.sleep(2)

    async def handle_http_request(self, request):
        return web.Response(text='HTTP response generated at {} seconds.'.format(time.time() - self.started))

    def start(self):
        # Web server setup.
        runner = web.AppRunner(self.server)
        loop.run_until_complete(runner.setup())
        site = web.TCPSite(runner, port=8081)
        loop.run_until_complete(site.start())

        # Gather all infinite loop coroutines.
        loop.run_until_complete(asyncio.gather(
            self.report_uptime(),
            self.make_http_request()
        ))


if __name__ == '__main__':
    aioviewer.start_server(port=8090)
    example = AioviewerExample()
    example.start()
