import asyncio
import inspect


def get_task_report():
    '''Returns a report of where each task is currently awaiting.'''

    report = []
    for t in asyncio.Task.all_tasks():
        coro = t._coro

        # Ignore completed tasks. They get cleaned up.
        if coro.cr_frame is None:
            continue

        info = inspect.getframeinfo(coro.cr_frame)
        report.append({
            'task_name': coro.__name__,
            'filename': info[0],
            'line_number': info[1],
            'function_name': info[2],
            'line_source': ''.join(info[3]).strip()
        })
    return report
