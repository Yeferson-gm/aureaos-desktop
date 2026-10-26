/* DING: Desktop Icons New Generation for GNOME Shell
 *
 * Copyright (C) 2022 Sundeep Mediratta - eslint fix errors and format GJS/Gnome guidelines
 * Copyright (C) 2019 Sergio Costas (rastersoft@gmail.com)
 * Based on code original (C) Carlos Soriano
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
import {Gio, GLib, DesktopAppInfo} from '../../dependencies/gi.js';
import {_} from '../../dependencies/gettext.js';
import {WebUtils} from '../../dependencies/localFiles.js';

export {DesktopIconsUtil};

const DesktopIconsUtil = class {
    constructor(Data, Utils) {
        this.mainApp = Data.mainApp;
        this.Enums = Data.Enums;
        this.FileUtils = Utils.FileUtils;
        this.ThumbnailLoader = Utils.ThumbnailLoader;
        this.Prefs = Utils.Preferences;
    }





    getMainApp() {
        return this.mainApp;
    }


    ensureDir(path) {
        const file = Gio.File.new_for_path(path);
        try {
            file.make_directory_with_parents(null);
        } catch (e) {
            if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
                throw e;
        }
        return path;
    }





    getScriptsDir() {
        return Gio.File.new_build_filenamev([
            GLib.get_home_dir(),
            this.Enums.NAUTILUS_SCRIPTS_DIR,
        ]);
    }

    getUserTerminalConfFile() {
        const xdgUserConfigFolder = GLib.get_user_config_dir();

        return Gio.File.new_build_filenamev([
            xdgUserConfigFolder,
            this.Enums.XDG_TERMINAL_LIST_FILE,
        ]);
    }

    getSystemTerminalConfFile() {
        const xdgEtcConfigFolder = GLib.get_system_config_dirs();
        const systemTerminalConfFiles = [];

        xdgEtcConfigFolder.forEach(f => {
            const gioFile =
                Gio.File.new_build_filenamev([
                    f,
                    this.Enums.XDG_TERMINAL_LIST_FILE,
                ]);

            systemTerminalConfFiles.push(gioFile);
        });

        return systemTerminalConfFiles;
    }

    getUserDataTerminalDir() {
        const userDataDir = GLib.get_user_data_dir();

        return Gio.File.new_build_filenamev([
            userDataDir,
            this.Enums.XDG_TERMINAL_DIR,
            this.Enums.XDG_TERMINAL_LIST_FILE,
        ]);
    }

    getSystemDataTerminalDirs() {
        const systemDataDirs = this.Enums.SYSTEM_DATA_DIRS;
        const systemDataTerminalFiles = [];

        systemDataDirs.forEach(f => {
            const gioFile = Gio.File.new_build_filenamev([
                f,
                this.Enums.XDG_TERMINAL_DIR,
                this.Enums.XDG_TERMINAL_LIST_FILE,
            ]);
            systemDataTerminalFiles.push(gioFile);
        });

        return systemDataTerminalFiles;
    }





    getTemplatesDir() {
        let templatesDir =
            GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_TEMPLATES);

        if ((templatesDir === GLib.get_home_dir()) || (templatesDir === null))
            return null;

        return Gio.File.new_for_commandline_arg(templatesDir);
    }








    getAppUserDataDir() {
        const userDataDir = GLib.get_user_data_dir();
        const appId = this.mainApp?.get_application_id
            ? this.mainApp.get_application_id()
            : null;

        if (!appId)
            throw new Error('Application ID is not available');

        return Gio.File.new_build_filenamev([userDataDir, appId]);
    }







    getWidgetsStateFile() {
        const appDir = this.getAppUserDataDir();
        return appDir.get_child('widgets.json');
    }







    clamp(value, min, max) {
        return Math.max(Math.min(value, max), min);
    }





    getFilteredEnviron() {
        let environ = [];
        for (let env of GLib.get_environ()) {




            if (env.startsWith('WAYLAND_SOCKET='))
                continue;

            environ.push(env);
        }
        return environ;
    }









    spawnCommandLine(commandLine, environ = null, onChildExit = null) {
        try {
            const [, argv] = GLib.shell_parse_argv(commandLine);
            return this.trySpawn(null, argv, environ, true, onChildExit);
        } catch (e) {
            console.error(e, `${commandLine} failed with ${e}`);
            return null;
        }
    }










    trySpawn(workdir, argv, environ = null, async = true, onChildExit = null) {






        const exec = async ? GLib.spawn_async : GLib.spawn_sync;
        const flags =
            async
                ? GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD
                : GLib.SpawnFlags.SEARCH_PATH;

        var pid;

        try {
            [, pid] = exec(workdir, argv, environ, flags,
                () => {});
        } catch (err) {

            if (err.matches(GLib.SpawnError, GLib.SpawnError.NOENT)) {
                throw new GLib.SpawnError({
                    code: GLib.SpawnError.NOENT,
                    message: _('Command not found'),
                });
            } else if (err instanceof GLib.Error) {





                let message = err.message.replace(/.*\((.+)\)/, '$1');
                throw new err.constructor({
                    code: err.code,
                    message,
                });
            } else {
                throw err;
            }
        }

        if (!async)
            return pid;





        GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, (childPid, status) => {
            if (onChildExit)
                onChildExit(childPid, status);
        });

        return pid;
    }










    distanceBetweenPoints(x, y, x2, y2) {
        return Math.pow(x - x2, 2) + Math.pow(y - y2, 2);
    }





    getExtraFolders() {
        const extraFolders = [];

        if (this.Prefs.desktopSettings.get_boolean('show-home')) {
            extraFolders.push(
                [
                    Gio.File.new_for_commandline_arg(GLib.get_home_dir()),
                    this.Enums.FileType.USER_DIRECTORY_HOME,
                ]
            );
        }

        if (this.Prefs.desktopSettings.get_boolean('show-trash')) {
            extraFolders.push(
                [
                    Gio.File.new_for_uri('trash:///'),
                    this.Enums.FileType.USER_DIRECTORY_TRASH,
                ]
            );
        }

        return extraFolders;
    }






    getMounts(volumeMonitor) {
        const showVolumes =
            this.Prefs.desktopSettings.get_boolean('show-volumes');

        const showNetwork =
            this.Prefs.desktopSettings.get_boolean('show-network-volumes');

        var mountedFileSystems;

        try {
            mountedFileSystems = volumeMonitor.get_mounts();
        } catch (e) {
            console.log(`Failed to get the list of mounts with ${e}`);
            return [];
        }

        let result = [];
        let uris = [];

        for (let gioMount of mountedFileSystems) {
            try {
                let isDrive =
                    (gioMount.get_drive() !== null) ||
                    (gioMount.get_volume() !== null);

                let uri = gioMount.get_default_location().get_uri();

                if (((isDrive && showVolumes) ||
                    (!isDrive && showNetwork)) &&
                    !uris.includes(uri)
                ) {
                    result.push([
                        gioMount.get_default_location(),
                        this.Enums.FileType.EXTERNAL_DRIVE,
                        gioMount,
                    ]);

                    uris.push(uri);
                }
            } catch (e) {
                console.log(`Failed with ${e} while getting volume`);
            }
        }
        return result;
    }







    getFileExtensionOffset(filename, opts = {'isDirectory': false}) {
        return this.FileUtils.getFileExtensionOffset(filename, opts);
    }

















    getBasenameBeforeCopySuffix(basename) {
        const copySuffix = /\(.*\)[^()]*$/;
        const suffixPosition = basename.search(copySuffix);
        if (suffixPosition <= 1)
            return null;

        return basename.slice(0, suffixPosition - 1);
    }








    replaceFileContentsAsync(file, contents, cancellable) {

        const textCoder = new TextEncoder();
        const byteArray = new GLib.Bytes(textCoder.encode(contents));

        return new Promise((resolve, reject) => {
            file.replace_contents_bytes_async(
                byteArray,
                null,
                true,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                cancellable,
                (sourceObject, res) => {
                    try {
                        resolve(file.replace_contents_finish(res));
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        });
    }






    readFileContentsAsync(file, cancellable = null) {
        return new Promise((resolve, reject) => {
            try {
                file.read_async(
                    GLib.PRIORITY_DEFAULT,
                    cancellable,
                    (actor, result) => {
                        try {
                            let inputstream = actor.read_finish(result);

                            let dataInputstream =
                                Gio.DataInputStream.new(inputstream);

                            let [string, number] =
                                dataInputstream.read_upto('', 0, cancellable);

                            if (number)
                                resolve(string);
                            else
                                reject(Error.new('Empty String'));
                        } catch (e) {
                            reject(e);
                        }
                    });
            } catch (e) {
                reject(new Error('Error reading file'));
            }
        });
    }












    readFileBytesAsync(file, bytes, cancellable = null, fromTail = false) {
        return new Promise((resolve, reject) => {
            let offset = 0;
            let newBytes = bytes;

            if (fromTail) {
                let info;
                try {
                    info = file.query_info(
                        'standard::size',
                        Gio.FileQueryInfoFlags.NONE,
                        cancellable
                    );
                } catch (e) {
                    reject(new Error(`Error getting file size: ${e}`));
                    return;
                }
                const fileSize = info.get_size();
                offset = Math.max(0, fileSize - bytes);
                newBytes = Math.min(bytes, fileSize);
            }

            try {
                file.read_async(
                    GLib.PRIORITY_DEFAULT,
                    cancellable,
                    (actor, result) => {
                        let inputstream;
                        try {
                            inputstream = actor.read_finish(result);
                        } catch (e) {
                            reject(
                                new Error(`Error opening input stream: ${e}`)
                            );
                            return;
                        }

                        function failAndClose(message) {
                            try {
                                inputstream.close(cancellable);
                            } catch (e) {

                            }
                            reject(new Error(message));
                        }

                        function doRead() {
                            inputstream.read_bytes_async(
                                newBytes,
                                GLib.PRIORITY_DEFAULT,
                                cancellable,
                                (sourceObject, res2) => {
                                    let data;
                                    try {
                                        data =
                                            sourceObject
                                            .read_bytes_finish(res2);
                                    } catch (e) {
                                        failAndClose(
                                            `Error reading bytes: ${e}`
                                        );
                                        return;
                                    }

                                    if (data && data.get_size() > 0) {
                                        try {
                                            inputstream.close(cancellable);
                                        } catch (e) {

                                        }
                                        resolve(data);
                                        return;
                                    }

                                    failAndClose('Empty Bytes');
                                }
                            );
                        }

                        if (offset === 0) {
                            doRead();
                            return;
                        }

                        inputstream.skip_async(
                            offset,
                            GLib.PRIORITY_DEFAULT,
                            cancellable,
                            (sourceObject, resSkip) => {
                                try {
                                    const skipped =
                                        sourceObject.skip_finish(resSkip);

                                    if (skipped !== offset) {
                                        failAndClose(
                                            `Skip Error:
                                                wanted offset ${offset} bytes,
                                                got ${skipped} bytes`
                                        );
                                        return;
                                    }
                                } catch (e) {
                                    failAndClose(`Error skipping bytes: ${e}`);
                                    return;
                                }
                                doRead();
                            }
                        );
                    }
                );
            } catch (e) {
                reject(new Error(`Error starting async read: ${e}`));
            }
        });
    }








    async checkIfPdfEncrypted(file, cancellable = null) {
        const fromTail = true;
        const data = await this.readFileBytesAsync(
            file,
            1024,
            cancellable,
            fromTail
        ).catch(e => logError(e));

        if (!data)
            return false;

        const decoder = new TextDecoder('latin1');

        const trailerText = decoder.decode(data);

        const hasEncrypt = trailerText.includes('/Encrypt');
        if (!hasEncrypt)
            return false;

        const looksLikeClassicTrailer = trailerText.includes('trailer');
        const looksLikeXrefStream =
            trailerText.includes('/Type') && trailerText.includes('/XRef');

        const encrypted = looksLikeClassicTrailer || looksLikeXrefStream;

        return encrypted;
    }








    async checkIfZipEncrypted(file, cancellable = null) {
        const data = await this.readFileBytesAsync(
            file,
            1024,
            cancellable
        ).catch(e => logError(e));

        if (!data)
            return false;



        const generalPurposeFlag = new Uint8Array([data.get_data()[6]]);
        const zipEncrypted = (generalPurposeFlag & 0x01) === 0x01;

        if (zipEncrypted)
            return true;


        const command = `zipinfo -v '${file.get_path()}'`;
        const decoder = new TextDecoder();

        try {
            const [, out,, status] = GLib.spawn_command_line_sync(command);

            if (status !== 0)
                return false;

            const contents = decoder.decode(out);
            return contents.trim().split('\n').some(l => {
                return l.includes('file security status:') &&
                    !l.includes('not encrypted');
            });
        } catch (e) {
            if (!e.matches(GLib.SpawnError, GLib.SpawnError.NOENT))
                console.error(`Error determining encryption Zip file ${e}`);
        }

        return false;
    }







    checkIf7zEncrypted(file) {
        const command = `7z l -pBadPassword -slt '${file.get_path()}'`;
        const decoder = new TextDecoder();

        try {
            const [, out, error] = GLib.spawn_command_line_sync(command);
            const contents = decoder.decode(error) + decoder.decode(out);
            return contents.trim().split('\n').some(l => {
                return l.includes('Encrypted = +') ||
                    l.includes('Wrong password?');
            });
        } catch (e) {
            if (!e.matches(GLib.SpawnError, GLib.SpawnError.NOENT))
                console.error(`Error determining encryption 7z file ${e}`);
        }

        return false;
    }







    parseTerminalList(fileList) {
        const regexpattern = /^[/\\*#-]/;
        const terminalGioDesktopAppInfoArray = [];

        if (fileList.endsWith('\n'))
            fileList = fileList.slice(0, -1);

        const fileListArray =
            fileList.split('\n').filter(f => !f.match(regexpattern));

        if (fileListArray.length) {
            fileListArray.forEach(f => {
                const appinfo = DesktopAppInfo.new(f.replace('+', ''));
                if (appinfo)
                    terminalGioDesktopAppInfoArray.push(appinfo);
            });
        }

        return terminalGioDesktopAppInfoArray;
    }







    parseUserDirsFile(content) {
        if (!content)
            return null;

        const lineArray = content.trim().split('\n');

        const desktopline =
            lineArray.filter(l => l.startsWith('XDG_DESKTOP_DIR='))[0];

        let xdgDesktopPath = desktopline.split('=')[1].trim();
        xdgDesktopPath = xdgDesktopPath.replace(/^"|"$/g, '');
        xdgDesktopPath = xdgDesktopPath.replace('$HOME', GLib.get_home_dir());

        return xdgDesktopPath;
    }









    async writeTextFileToPath(text, destinationDir, filename,
        dropCoordinates, cancellable = null) {
        const file = destinationDir.get_child(filename);

        try {
            await this.FileUtils
                .recursivelyMakeDir(destinationDir, cancellable);

            const info = new Gio.FileInfo();
            info.set_attribute_uint32(Gio.FILE_ATTRIBUTE_UNIX_MODE, 0o700);

            await destinationDir.set_attributes_async(
                info,
                Gio.FileQueryInfoFlags.NONE,
                GLib.PRIORITY_NORMAL,
                cancellable
            );
        } catch (e) {
            if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
                throw e;
        }

        await this.replaceFileContentsAsync(file, text, cancellable);

        await this.FileUtils.setDropPosition(file, dropCoordinates, cancellable, GLib.PRIORITY_LOW);
    }










    copyDesktopFileToDesktop(fileUri, dropCoordinates) {
        return new Promise((resolve, reject) => {
            let gioFile = Gio.File.new_for_uri(fileUri);

            let destinationGioFile = Gio.File.new_build_filenamev([
                GLib.get_user_special_dir(
                    GLib.UserDirectory.DIRECTORY_DESKTOP
                ),
                gioFile.get_basename(),
            ]);

            let gioFileCopyFlags =
                Gio.FileCopyFlags.OVERWRITE |
                Gio.FileCopyFlags.TARGET_DEFAULT_PERMS;

            gioFile.copy_async(
                destinationGioFile,
                gioFileCopyFlags,
                GLib.PRIORITY_LOW,
                null,
                null,
                (source, result) => {
                    try {
                        let res = source.copy_finish(result);

                        if (res) {
                            let info = new Gio.FileInfo();

                            if (dropCoordinates !== null) {
                                info.set_attribute_string(
                                    'metadata::nautilus-drop-position',
                                    `${dropCoordinates[0]},${dropCoordinates[1]}`
                                );
                            }

                            let newUnixMode =
                                this.Enums.UnixPermissions.S_IRUSR |
                                this.Enums.UnixPermissions.S_IWUSR |
                                this.Enums.UnixPermissions.S_IXUSR |
                                this.Enums.UnixPermissions.S_IRGRP |
                                this.Enums.UnixPermissions.S_IWGRP |
                                this.Enums.UnixPermissions.S_IROTH;

                            info.set_attribute_uint32(
                                Gio.FILE_ATTRIBUTE_UNIX_MODE, newUnixMode
                            );

                            info.set_attribute_string(
                                'metadata::trusted', 'true'
                            );

                            destinationGioFile.set_attributes_async(
                                info,
                                Gio.FileQueryInfoFlags.NONE,
                                GLib.PRIORITY_LOW,
                                null,
                                (sour, resul) => {
                                    try {
                                        resolve(
                                            sour.set_attributes_finish(resul)
                                        );
                                    } catch (error) {
                                        console.log(
                                            'Failed to make executable ' +
                                            `.desktop File: ${error.message}`
                                        );

                                        reject(error);
                                    }
                                }
                            );
                        }
                    } catch (e) {
                        console.error(e);

                        reject(e);
                    }
                }
            );
        });
    }






    windowHidePagerTaskbarModal(window, modal) {
        window.set_application(this.mainApp);
        let title = window.get_title();
        if (title === null)
            title = '';

        if (modal)
            title += '  ';
        else
            title += ' ';

        window.set_title(title);

        if (modal) {
            window.set_modal(true);
            window.grab_focus();
        }
    }





    waitDelayMs(ms) {
        return new Promise(resolve => {
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
                resolve();
                return false;
            });
        });
    }









    coordinatesEqual(coordA, coordB) {
        if (coordA === coordB)
            return true;

        if (coordA && coordB)
            return (coordA[0] === coordB[0]) && (coordA[1] === coordB[1]);

        return false;
    }

    checkAppOpensFileType(
        gioDesktopAppInfo,
        fileUri = null,
        attributeContentType = null
    ) {
        let Appname = gioDesktopAppInfo.get_name();
        let gioFileInfo;
        let AppsSupportingOpen = [];

        if (fileUri) {
            gioFileInfo =
                Gio.File.new_for_uri(fileUri)
                .query_info(
                    this.Enums.DEFAULT_ATTRIBUTES,
                    Gio.FileQueryInfoFlags.NONE,
                    null
                );

            AppsSupportingOpen =
                Gio.AppInfo.get_all_for_type(gioFileInfo.get_content_type());
        } else if (attributeContentType) {
            AppsSupportingOpen =
                Gio.AppInfo.get_all_for_type(attributeContentType);
        } else {
            return {canopenFile: false, Appname: 'None'};
        }

        AppsSupportingOpen = AppsSupportingOpen.map(f => f.get_name());

        let canopenFile;

        if (AppsSupportingOpen.includes(Appname))
            canopenFile = true;
        else
            canopenFile = false;

        return {canopenFile, Appname};
    }








    async readJsonFile(file, cancellable = null) {
        try {
            const text = await this.readFileContentsAsync(file, cancellable);
            if (!text)
                return null;

            return JSON.parse(text);
        } catch (e) {
            if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
                console.error(`readJsonFile(${file.get_path?.() ?? '??'}):`, e);

            return null;
        }
    }










    async writeJsonFile(file, data, cancellable = null) {
        const parent = file.get_parent();

        if (parent) {
            try {
                await this.FileUtils.recursivelyMakeDir(parent, cancellable);
            } catch (e) {
                if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
                    throw e;
            }
        }

        let text;
        try {
            text = JSON.stringify(data, null, 2);
        } catch (e) {
            console.error('writeJsonFile: JSON.stringify failed:', e);
            throw e;
        }

        await this.replaceFileContentsAsync(file, text, cancellable);
    }








    linkBasename(title, url) {
        const fallback = url
            ? WebUtils.filenameFromURL(url) ?? 'Link'
            : 'File';
        const descriptiveTitle = WebUtils.webURL(title) ? '' : title;
        return this.FileUtils.sanitizeFilename(descriptiveTitle, fallback);
    }










    createContentFile(directory, data, pendingPlacement = null) {
        const name = this.linkBasename(data.name, null);
        return this.FileUtils.createUniqueFile(
            directory,
            name,
            data.bytes,
            null,
            pendingPlacement
        );
    }

    transferTextFilename(text) {
        const firstWords = text.trim()
            .split(/\s+/u)
            .slice(0, this.Enums.TRANSFER_TEXT_FILENAME_WORDS)
            .join(' ');
        return this.FileUtils.sanitizeFilename(firstWords, 'Dragged Text');
    }

    createTransferTextFile(directory, text, pendingPlacement = null) {
        const filename = this.transferTextFilename(text);
        const bytes = new GLib.Bytes(new TextEncoder().encode(text));
        return this.FileUtils.createUniqueFile(
            directory,
            filename,
            bytes,
            null,
            pendingPlacement
        );
    }











    async writeTransferContentToDesktop(
        directory,
        contents,
        pendingPlacement
    ) {
        const types = this.Enums.DropContentsType;

        if (contents.type === types.FILE_CONTENT) {
            await this.createContentFile(
                directory,
                contents,
                pendingPlacement
            );
            return true;
        }

        if (contents.type === types.WEB_LINKS) {
            let customIconURI = null;
            if (contents.customIcon && this.ThumbnailLoader) {
                const customIconsDirectory = this.getAppUserDataDir()
                    .get_child('link-icons');
                customIconURI = await this.ThumbnailLoader.saveCustomIcon(
                    contents.customIcon,
                    customIconsDirectory
                ).catch(() => null);
            }

            for (const link of contents.links) {

                // eslint-disable-next-line no-await-in-loop
                await this.createLinkFile(
                    directory,
                    link,
                    pendingPlacement,
                    customIconURI
                );
            }
            return true;
        }

        if (contents.type === types.TEXT) {
            await this.createTransferTextFile(
                directory,
                contents.text,
                pendingPlacement
            );
            return true;
        }

        return false;
    }









    createSymbolicLinks(
        directory,
        fileReferences,
        pendingPlacement = null
    ) {
        return Promise.all(fileReferences.map(reference => {
            const source = Gio.File.new_for_uri(reference);
            return this.FileUtils.createUniqueSymbolicLink(
                directory,
                source,
                null,
                pendingPlacement
            );
        }));
    }











    async createLinkFile(
        directory,
        link,
        pendingPlacement = null,
        customIconURI = null
    ) {
        const basename = this.linkBasename(link.title, link.url);
        const bytes = new GLib.Bytes(new TextEncoder().encode(WebUtils.linkHTML(link.url, link.title)));
        const file = await this.FileUtils.createUniqueFile(
            directory,
            `${basename}.html`,
            bytes,
            null,
            pendingPlacement
        );
        if (customIconURI) {
            await this.FileUtils.setStringAttribute(
                file,
                'metadata::custom-icon',
                customIconURI
            ).catch(() => {});
        }
        return file;
    }
};
