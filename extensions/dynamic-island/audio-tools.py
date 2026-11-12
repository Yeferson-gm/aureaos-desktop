#!/usr/bin/env python3
import array
import json
import math
from pathlib import Path
import signal
import subprocess
import sys
import wave

child = None
running = True


def stop(_signal, _frame):
    global running
    running = False
    if child and child.poll() is None:
        child.terminate()


def main():
    global child
    mode = sys.argv[1]
    if mode not in ('levels', 'record'):
        raise ValueError('Modo de audio desconocido')
    args = ['parec', '--format=s16le', '--rate=16000', '--channels=1']
    if mode == 'levels':
        sink = subprocess.check_output(['pactl', 'get-default-sink'], text=True, timeout=3).strip()
        args += ['--device=' + sink + '.monitor', '--client-name=AureaOutputMeter', '--stream-name=AureaOutputMeter']
    child = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    output = None
    try:
        if mode == 'record':
            path = Path(sys.argv[2])
            output = wave.open(str(path), 'wb')
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(16000)
        frames = 0
        while running and frames < 16000 * 300:
            block = child.stdout.read(3200)
            if not block:
                break
            if output:
                output.writeframesraw(block)
                frames += len(block) // 2
            else:
                values = array.array('h', block[:len(block) // 2 * 2])
                if sys.byteorder != 'little':
                    values.byteswap()
                groups = [values[i::4] for i in range(4)]
                levels = [min(1, math.sqrt(sum(v*v for v in group) / max(1, len(group))) / 12000) for group in groups]
                print(json.dumps(levels), flush=True)
    finally:
        if output:
            output.close()
        if child.poll() is None:
            child.terminate()
        child.wait(timeout=3)


if __name__ == '__main__':
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
