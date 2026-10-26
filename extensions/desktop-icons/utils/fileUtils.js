/* eslint-disable no-control-regex -- Sanitize untrusted filenames. */
/* eslint-disable jsdoc/require-param-type */
/* DING: Desktop Icons New Generation for GNOME Shell
 *
 * Copyright (C) 2022 Marco Trevisan <marco.trevisan@canonical.com>
 * Copyright (C) 2026 Sundeep Mediratta <smedius@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const DEFAULT_ENUMERATE_BATCH_SIZE = 100;
const DEFAULT_QUERY_ATTRIBUTES = [
    Gio.FILE_ATTRIBUTE_STANDARD_NAME,
    Gio.FILE_ATTRIBUTE_STANDARD_TYPE,
].join(',');








export async function enumerateDir(dir, cancellable = null, priority = GLib.PRIORITY_DEFAULT,
    queryAttributes = DEFAULT_QUERY_ATTRIBUTES) {
    let childrenEnumerator;
    try {
        childrenEnumerator = await dir.enumerate_children_async(queryAttributes,
            Gio.FileQueryInfoFlags.NONE, priority, cancellable);

        const children = [];
        while (true) {



            // eslint-disable-next-line no-await-in-loop
            const batch = await childrenEnumerator.next_files_async(
                DEFAULT_ENUMERATE_BATCH_SIZE, priority, cancellable);

            if (!batch.length)
                return children;

            children.push(...batch);
        }
    } finally {
        if (!childrenEnumerator?.is_closed())
            await childrenEnumerator?.close_async(priority, null);
    }
}









export async function enumerateDirOrEmpty(
    dir,
    cancellable = null,
    priority = GLib.PRIORITY_DEFAULT,
    queryAttributes = DEFAULT_QUERY_ATTRIBUTES
) {
    try {
        return await enumerateDir(dir, cancellable, priority, queryAttributes);
    } catch (e) {
        if (e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) {
            console.warn(`Directory does not exist: ${dir.get_path()}`);
            return [];
        }

        throw e;
    }
}








export async function recursivelyDeleteDir(dir, deleteParent, cancellable = null,
    priority = GLib.PRIORITY_DEFAULT) {
    const children = await enumerateDir(dir, cancellable, priority);
    for (let info of children)
        // eslint-disable-next-line no-await-in-loop
        await deleteFile(dir.get_child(info.get_name()), info, cancellable, priority);


    if (deleteParent)
        await dir.delete_async(priority, cancellable);
}








export async function deleteFile(file, info = null, cancellable = null,
    priority = GLib.PRIORITY_DEFAULT) {
    if (!info) {
        info = await file.query_info_async(
            Gio.FILE_ATTRIBUTE_STANDARD_TYPE, Gio.FileQueryInfoFlags.NONE,
            priority, cancellable);
    }

    const type = info.get_file_type();
    if (type === Gio.FileType.REGULAR || type === Gio.FileType.SYMBOLIC_LINK) {
        await file.delete_async(priority, cancellable);
    } else if (type === Gio.FileType.DIRECTORY) {
        await recursivelyDeleteDir(file, true, cancellable, priority);
    } else {
        throw new GLib.Error(Gio.IOErrorEnum,
            Gio.IOErrorEnum.NOT_SUPPORTED,
            `${file.get_path()} of type ${type} cannot be removed`);
    }
}







export async function queryExists(file, cancellable = null,
    priority = GLib.PRIORITY_DEFAULT) {
    try {
        await file.query_info_async(Gio.FILE_ATTRIBUTE_STANDARD_TYPE,
            Gio.FileQueryInfoFlags.NONE, priority, cancellable);
        return true;
    } catch (e) {
        if (e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
            throw e;
        if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
            console.error(e);
        return false;
    }
}









export async function recursivelyMakeDir(dir, cancellable = null,
    priority = GLib.PRIORITY_DEFAULT) {
    try {
        await dir.make_directory_async(priority, cancellable);
        return;
    } catch (e) {
        if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
            throw e;
    }

    const parent = dir.get_parent();
    if (!parent)
        throw new GLib.Error(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND, 'Directory has no parent');
    try {
        await recursivelyMakeDir(parent, cancellable, priority);
    } catch (e) {
        if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
            throw e;
    }
    try {
        await dir.make_directory_async(priority, cancellable);
    } catch (e) {

        if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
            throw e;
    }
}







export function getFileExtensionOffset(filename, opts = {isDirectory: false}) {
    let offset = filename.length;
    let extension = '';
    if (!opts.isDirectory) {
        for (const suffix of ['.gz', '.bz2', '.sit', '.Z', '.bz', '.xz']) {
            if (filename.endsWith(suffix)) {
                offset -= suffix.length;
                extension = filename.substring(offset);
                filename = filename.substring(0, offset);
                break;
            }
        }
        const lastDot = filename.lastIndexOf('.');
        if (lastDot > 0) {
            offset = lastDot;
            extension = filename.substring(offset) + extension;
            filename = filename.substring(0, offset);
        }
    }
    return {offset, basename: filename, extension};
}







export function collisionName(filename, index) {
    if (!index)
        return filename;
    const {basename, extension} = getFileExtensionOffset(filename);
    return `${basename} ${index}${extension}`;
}








export async function writeExclusive(file, bytes, cancellable = null) {
    const stream = await file.create_async(Gio.FileCreateFlags.PRIVATE, GLib.PRIORITY_DEFAULT, cancellable);
    try {
        let offset = 0;
        const size = bytes.get_size();
        while (offset < size) {
            const remaining = GLib.Bytes.new_from_bytes(bytes, offset, size - offset);
            // eslint-disable-next-line no-await-in-loop
            const written = await stream.write_bytes_async(remaining, GLib.PRIORITY_DEFAULT, cancellable);
            if (written <= 0 || written > size - offset)
                throw new Error('Incomplete file write');
            offset += written;
        }
        await stream.close_async(GLib.PRIORITY_DEFAULT, cancellable);
    } catch (e) {

        try {
            await stream.close_async(GLib.PRIORITY_DEFAULT, null);
        } catch (_closeError) {

        }
        await file.delete_async(GLib.PRIORITY_DEFAULT, null).catch(error => console.error(error));
        throw e;
    }
}















export async function createUniqueFile(
    directory,
    filename,
    bytes,
    cancellable = null,
    creationObserver = null
) {
    if (!filename || filename === '.' || filename === '..' || filename.includes('/') || filename.includes('\0'))
        throw new Error('Expected a single filename');
    try {
        await recursivelyMakeDir(directory, cancellable);
    } catch (e) {
        if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
            throw e;
    }
    for (let index = 0; ; index++) {
        const file = directory.get_child(collisionName(filename, index));
        const creationRegistration = creationObserver?.beforeCreate(file);
        try {
            // eslint-disable-next-line no-await-in-loop
            await writeExclusive(file, bytes, cancellable);
            return file;
        } catch (e) {


            creationObserver?.creationFailed(file, creationRegistration);
            if (!e.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
                throw e;
        }
    }
}










export function createUniqueSymbolicLink(
    directory,
    source,
    cancellable = null,
    creationObserver = null
) {
    const sourcePath = source.get_path();
    if (!sourcePath)
        throw new Error('Symbolic links require a local source file');

    const filename = source.get_basename();
    for (let index = 0; ; index++) {
        const file = directory.get_child(collisionName(filename, index));
        const creationRegistration = creationObserver?.beforeCreate(file);
        try {
            file.make_symbolic_link(sourcePath, cancellable);
            return file;
        } catch (error) {
            creationObserver?.creationFailed(file, creationRegistration);
            if (!error.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
                throw error;
        }
    }
}











export async function setStringAttribute(file, attribute, value, cancellable = null,
    priority = GLib.PRIORITY_DEFAULT,
    queryFlags = Gio.FileQueryInfoFlags.NONE) {
    const info = new Gio.FileInfo();
    info.set_attribute_string(attribute, value);
    const [result] = await file.set_attributes_async(info, queryFlags, priority, cancellable);
    if (result.get_attribute_status(attribute) !== Gio.FileAttributeStatus.SET)
        throw new Error(`Could not set ${attribute}`);
}









export async function setDropPosition(file, coordinates, cancellable = null,
    priority = GLib.PRIORITY_DEFAULT) {
    if (!coordinates)
        return;
    await setStringAttribute(file, 'metadata::nautilus-drop-position', coordinates.join(','), cancellable, priority);
}







export async function copyFile(source, destination, cancellable = null) {
    await new Promise((resolve, reject) => {
        try {
            source.copy_async(
                destination,
                Gio.FileCopyFlags.OVERWRITE |
                    Gio.FileCopyFlags.TARGET_DEFAULT_PERMS,
                GLib.PRIORITY_DEFAULT,
                cancellable,
                null,
                (src, result) => {
                    try {
                        resolve(src.copy_finish(result));
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        } catch (e) {
            reject(e);
        }
    });
}







export async function moveFile(source, destination, cancellable = null) {
    await new Promise((resolve, reject) => {
        try {
            source.move_async(
                destination,
                Gio.FileCopyFlags.OVERWRITE,
                GLib.PRIORITY_DEFAULT,
                cancellable,
                null,
                (src, result) => {
                    try {
                        resolve(src.move_finish(result));
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        } catch (e) {
            reject(e);
        }
    });
}







export async function copyTree(sourceDir, destinationDir, cancellable = null) {
    await recursivelyMakeDir(destinationDir, cancellable);

    const children = await enumerateDir(sourceDir, cancellable);
    for (const info of children) {
        const name = info.get_name();
        const sourceChild = sourceDir.get_child(name);
        const destinationChild = destinationDir.get_child(name);

        if (info.get_file_type() === Gio.FileType.DIRECTORY) {
            // eslint-disable-next-line no-await-in-loop
            await copyTree(sourceChild, destinationChild, cancellable);
        } else {
            // eslint-disable-next-line no-await-in-loop
            await copyFile(sourceChild, destinationChild, cancellable);
        }
    }
}








export async function findChildDirRecursive(
    rootDir,
    targetName,
    cancellable = null
) {
    const children = await enumerateDir(rootDir, cancellable);
    for (const info of children) {
        if (info.get_file_type() !== Gio.FileType.DIRECTORY)
            continue;

        const child = rootDir.get_child(info.get_name());
        if (info.get_name() === targetName)
            return child;

        // eslint-disable-next-line no-await-in-loop
        const nested = await findChildDirRecursive(
            child,
            targetName,
            cancellable
        );
        if (nested)
            return nested;
    }

    return null;
}







export function sanitizeFilename(value, fallback = 'File') {
    const clean = text => text.normalize('NFC')
        .replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/gu, ' ')
        .replace(/\s+/gu, ' ').trim().replace(/^[. ]+|[. ]+$/g, '');
    let name = clean(value || '');
    if (!name)
        name = clean(fallback);
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))
        name = `_${name}`;

    let result = '';
    let length = 0;
    const encoder = new TextEncoder();
    for (const character of name) {
        length += encoder.encode(character).length;
        if (length > 200)
            break;
        result += character;
    }
    return result.trim().replace(/[. ]+$/g, '') || 'Link';
}
