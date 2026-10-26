import io
import json
import re
import sys
import tokenize
from pathlib import Path

import tree_sitter
import tree_sitter_bash
import tree_sitter_css
import tree_sitter_javascript

root = Path(__file__).resolve().parent.parent
parsers = {
    suffix: tree_sitter.Parser(tree_sitter.Language(module.language()))
    for suffix, module in {
        '.js': tree_sitter_javascript,
        '.mjs': tree_sitter_javascript,
        '.css': tree_sitter_css,
        '.sh': tree_sitter_bash,
    }.items()
}
legal = re.compile(r'copyright|SPDX-|GNU (?:General|Lesser)|permission is hereby|all rights reserved|@license', re.I)
directive = re.compile(r'^#!|eslint|shellcheck|sourceMappingURL|sourceURL|^#.*coding[:=]|^/\*\s*(?:exported|global)\b')

def nodes(node):
    yield node
    for child in node.children:
        yield from nodes(child)

def tokens(parser, data):
    return [(node.type, data[node.start_byte:node.end_byte])
            for node in nodes(parser.parse(data).root_node)
            if not node.children and node.type not in ('comment', 'hash_bang_line')]

report = []
for directory in ['extensions', 'integrations', 'theme', 'tools', 'tests']:
    for file in sorted((root / directory).rglob('*')):
        if not file.is_file() or file.is_symlink():
            continue
        suffix = file.suffix
        if suffix not in (*parsers, '.py', '.svg', '.xml', '.ui', '.theme'):
            continue
        data = file.read_bytes()
        ranges = []
        parser = parsers.get(suffix)
        if parser:
            ranges = [(n.start_byte, n.end_byte) for n in nodes(parser.parse(data).root_node) if n.type == 'comment']
        elif suffix == '.py':
            lines = data.splitlines(keepends=True)
            starts = [0]
            for line in lines:
                starts.append(starts[-1] + len(line))
            for item in tokenize.tokenize(io.BytesIO(data).readline):
                if item.type == tokenize.COMMENT:
                    a, b = item.start, item.end
                    ranges.append((starts[a[0]-1] + len(lines[a[0]-1].decode()[:a[1]].encode()),
                                   starts[b[0]-1] + len(lines[b[0]-1].decode()[:b[1]].encode())))
        elif suffix == '.theme':
            ranges = [(m.start(), m.end()) for m in re.finditer(rb'(?m)^[ \t]*#[^\n]*', data)]
        else:
            ranges = [(m.start(), m.end()) for m in re.finditer(rb'<!--[\s\S]*?-->', data)]
        notes, edits = [], []
        for start, end in ranges:
            text = data[start:end].decode('utf8')
            if legal.search(text) or directive.search(text):
                continue
            notes.append((data[:start].count(b'\n') + 1, text))
            edits.append((start, end))
        if not edits:
            continue
        updated = data
        for start, end in reversed(edits):
            updated = updated[:start] + re.sub(rb'[^\r\n]', b' ', updated[start:end]) + updated[end:]
        if parser and tokens(parser, data) != tokens(parser, updated):
            raise RuntimeError(f'Cambian tokens ejecutables: {file}')
        lines = updated.splitlines(keepends=True)
        affected = set()
        for start, end in edits:
            affected.update(range(data[:start].count(b'\n'), data[:end].count(b'\n') + 1))
        for number in affected:
            if number < len(lines):
                ending = b'\n' if lines[number].endswith(b'\n') else b''
                lines[number] = lines[number].rstrip(b' \t\r\n') + ending
        updated = b''.join(lines)
        if parser and tokens(parser, data) != tokens(parser, updated):
            raise RuntimeError(f'Cambian tokens tras limpiar espacios: {file}')
        relative = file.relative_to(root)
        output = root / 'docs/code-notes' / (str(relative) + '.md')
        if output.exists():
            raise RuntimeError(f'Documentación existente, no sobrescribir: {output}')
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text('# Notas de ' + str(relative) + '\n\n'
                          'Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.\n\n'
                          + '\n\n'.join(f'## Línea {number}\n\n````text\n{text}\n````' for number, text in notes) + '\n')
        file.write_bytes(updated)
        report.append({'file': str(relative), 'comments': len(notes)})
print(json.dumps({'files': len(report), 'comments': sum(item['comments'] for item in report)}))
