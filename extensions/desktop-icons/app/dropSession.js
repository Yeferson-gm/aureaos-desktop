/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright (C) 2026 Sundeep Mediratta (smedius@gmail.com) */
import {Gdk, Gio} from '../dependencies/gi.js';
import {ContentReader, Enums, WebUtils} from '../dependencies/localFiles.js';























export {DropSession};













const DropSession = class {
    constructor(gtkDropController, desktopManager) {
        this._gtkDropController = gtkDropController;
        this._desktopManager = desktopManager;
        this._thumbnailLoader = desktopManager.ThumbnailLoader;
        this._drop = null;
        this._formats = null;
        this._mimeTypes = [];
        this._mimeTypeSet = new Set();
        this._route = null;
        this._classifiedURIListContents = null;
        this._cancellable = null;
        this._cancellableSignalId = 0;
        this._effectiveDestination = null;
        this._selectionCanBeRepositioned = true;
        this._hovering = false;
        this._dropBeingProcessed = null;
    }



    accept(drop) {
        this._updateDrop(drop);
        const accepted = this.acceptsDrop;
        if (!accepted)
            this.release(drop);
        return accepted;
    }

    enter(drop) {
        this._updateDrop(drop);
        this._hovering = true;
        return this._updateAction();
    }

    motion(drop, pointerDestination) {
        this._updateDrop(drop);
        return this._updateAction(pointerDestination);
    }

    resolveEffectiveDestination(drop, pointerDestination) {
        this._updateDrop(drop);
        this._effectiveDestination =
            this._applyDestinationPolicy(pointerDestination);
        return this._effectiveDestination;
    }

    canDropOn(destination) {
        return !!this._preferredActionFor(destination);
    }







    async readDropContents(context) {
        this._dropBeingProcessed = context.drop;
        this._hovering = false;
        const contents = await this._readCapturedDropContents(context);

        if (context.cancellable.is_cancelled())
            throw new Error('Drop was cancelled while reading its contents');

        return contents;
    }

    reportDropError(context, error) {
        if (!context.cancellable.is_cancelled())
            console.error(error);
    }

    completeDrop(drop, action) {
        try {
            drop.finish(action);
        } finally {
            if (this._dropBeingProcessed === drop)
                this._dropBeingProcessed = null;
            this.release(drop);
        }
    }

    leave(drop) {
        if (this._drop !== drop)
            return;

        this._hovering = false;
        if (this._dropBeingProcessed !== drop)
            this.release(drop);
    }

    release(drop) {
        if (this._drop !== drop)
            return;

        this._releaseCurrentDrop();
    }

    destroy() {
        this._releaseCurrentDrop();
        this._gtkDropController = null;
        this._desktopManager = null;
        this._thumbnailLoader = null;
    }





    _updateDrop(drop) {
        if (this._drop === drop)
            return;

        this._releaseCurrentDrop();

        this._drop = drop;
        this._selectionCanBeRepositioned =
            this._desktopManager.selectionCanBeRepositioned();
        this._formats = drop.get_formats();
        this._mimeTypes = this._formats.get_mime_types();
        this._mimeTypeSet = new Set(this._mimeTypes);
        this._route = this._chooseInitialDropRoute();

        const cancellable = new Gio.Cancellable();
        this._cancellableSignalId = cancellable.connect(() =>
            this._cancelDrop(drop, cancellable));
        this._cancellable = cancellable;
        this._classifyURIListForRouting(drop);
    }

    _releaseCurrentDrop() {
        const cancellable = this._cancellable;
        const cancellableSignalId = this._cancellableSignalId;
        try {
            if (cancellableSignalId)
                cancellable.disconnect(cancellableSignalId);
            cancellable?.cancel();
        } finally {
            this._clearCurrentDrop();
        }
    }

    _clearCurrentDrop() {
        this._drop = null;
        this._formats = null;
        this._mimeTypes = [];
        this._mimeTypeSet.clear();
        this._route = null;
        this._classifiedURIListContents = null;
        this._cancellable = null;
        this._cancellableSignalId = 0;
        this._effectiveDestination = null;
        this._selectionCanBeRepositioned = true;
        this._hovering = false;
    }

    _chooseInitialDropRoute() {
        const routes = Enums.DndOfferRoute;
        const targets = Enums.DndTargetInfo;

        if (this._offersMime(targets.DING_ICON_LIST))
            return routes.INTERNAL_DESKTOP_ITEMS;

        if (this._offersMime(targets.GNOME_ICON_LIST))
            return routes.FILE_OPERATION;

        if (this._offersAnyMime(targets.URL_FORMATS))
            return routes.READ_TEXT_OR_WEB_LINK;

        if (this._offersMime(targets.URI_LIST))
            return routes.INSPECT_URI_LIST;

        if (this._offersType(Gdk.FileList.$gtype) ||
            this._offersType(Gio.File.$gtype))
            return routes.FILE_OPERATION;

        if (this._offersFileContents())
            return routes.READ_FILE_CONTENT;

        if (WebUtils.htmlFormats(this._mimeTypes).length ||
            this._offersAnyMime(targets.TEXT_FORMATS))
            return routes.READ_TEXT_OR_WEB_LINK;

        return routes.UNSUPPORTED;
    }



    _offersMime(mimeType) {
        return this._mimeTypeSet.has(mimeType);
    }

    _offersAnyMime(mimeTypes) {
        return mimeTypes.some(mimeType => this._offersMime(mimeType));
    }

    _offersType(gtype) {
        return this._formats.contain_gtype(gtype);
    }

    _offersFileContents() {
        return this._mimeTypes.some(mime => WebUtils.contentName(mime)) ||
            WebUtils.imageFormats(this._mimeTypes).length > 0;
    }



    _cancelDrop(drop, cancellable) {
        if (this._drop !== drop ||
            this._cancellable !== cancellable)
            return;

        const noAction = Gdk.DragAction.NONE ?? 0;
        drop.status(noAction, noAction);
        this._clearCurrentDrop();
    }

    _classifyURIListForRouting(drop) {
        if (this._route !== Enums.DndOfferRoute.INSPECT_URI_LIST)
            return;

        const context = this._captureReadContext();
        void this._readAndClassifyURIListContents(context)
            .catch(() => ({
                type: Enums.DropContentsType.UNSUPPORTED,
                reason: 'Unable to read URI list',
            }))
            .then(contents => {
                if (this._drop !== drop)
                    return contents;

                this._classifiedURIListContents = contents;
                this._route = this._chooseResolvedDropRoute(contents);

                if (this._route === Enums.DndOfferRoute.UNSUPPORTED)
                    this._rejectAndReleaseDrop(drop);
                else if (this._hovering)
                    this._updateAction(this._effectiveDestination);

                return contents;
            });
    }



    _captureReadContext() {
        return Object.freeze({
            drop: this._drop,
            cancellable: this._cancellable,
            route: this._route,
            formats: this._formats,
            mimeTypes: Object.freeze([...this._mimeTypes]),
            classifiedURIListContents: this._snapshotDropContents(
                this._classifiedURIListContents
            ),
        });
    }

    _snapshotDropContents(contents) {
        if (!contents)
            return null;

        const snapshot = {...contents};
        if (contents.links) {
            snapshot.links = Object.freeze(contents.links.map(link =>
                Object.freeze({...link})));
        }

        return Object.freeze(snapshot);
    }

    _readAndClassifyURIListContents(context) {
        return this._createContentsReader(context).readAndClassifyURIList();
    }

    _createContentsReader(context = this._captureReadContext()) {
        return new ContentReader(
            context.drop,
            context,
            this._thumbnailLoader
        );
    }

    _chooseResolvedDropRoute(contents) {
        const routes = Enums.DndOfferRoute;
        const types = Enums.DropContentsType;
        if (contents.type === types.FILE_REFERENCES)
            return routes.FILE_OPERATION;
        if (contents.type === types.UNSUPPORTED)
            return routes.UNSUPPORTED;
        return routes.READ_TEXT_OR_WEB_LINK;
    }

    _rejectAndReleaseDrop(drop) {
        this._gtkDropController.reject_drop(drop);
        this.release(drop);
    }

    _updateAction(destination = null) {
        this._effectiveDestination = destination
            ? this._applyDestinationPolicy(destination)
            : null;
        const action = this._preferredActionFor(this._effectiveDestination);
        this._advertiseAction(action);
        return action;
    }

    _applyDestinationPolicy(pointerDestination) {
        if (this._shouldTreatFileItemAsGridDestination(pointerDestination))
            return {...pointerDestination, fileItem: null};

        return pointerDestination;
    }

    _shouldTreatFileItemAsGridDestination(pointerDestination) {
        return this._route ===
            Enums.DndOfferRoute.INTERNAL_DESKTOP_ITEMS &&
            pointerDestination.fileItem?._hasToRouteDragToGrid();
    }

    _preferredActionFor(destination = null) {
        const routes = Enums.DndOfferRoute;
        if (this._routeCreatesDesktopContent()) {
            if (destination?.fileItem)
                return Gdk.DragAction.NONE ?? 0;
            return this._drop.get_actions() & Gdk.DragAction.COPY;
        }

        if (this._route === routes.INSPECT_URI_LIST ||
            this._route === routes.UNSUPPORTED)
            return Gdk.DragAction.NONE ?? 0;

        if (destination?.fileItem) {
            if (!destination.fileItem.dropCapable)
                return Gdk.DragAction.NONE ?? 0;

            if (destination.fileItem._fileExtra ===
                Enums.FileType.EXTERNAL_DRIVE)
                return Gdk.DragAction.COPY;
        } else if (this._route === routes.INTERNAL_DESKTOP_ITEMS &&
            destination && !this._selectionCanBeRepositioned) {
            return Gdk.DragAction.NONE ?? 0;
        }

        return Gdk.DragAction.MOVE;
    }

    _routeCreatesDesktopContent() {
        const routes = Enums.DndOfferRoute;
        return this._route === routes.READ_FILE_CONTENT ||
            this._route === routes.READ_TEXT_OR_WEB_LINK;
    }

    _advertiseAction(action) {
        const noAction = Gdk.DragAction.NONE ?? 0;
        if (!action) {
            this._drop.status(noAction, noAction);
            return;
        }

        if (this._routeCreatesDesktopContent()) {
            this._drop.status(action, action);
            return;
        }

        this._drop.status(this.supportedDropActions, action);
    }




    _readCapturedDropContents(context) {
        return this._createContentsReader(context).readContents();
    }





    get dropContext() {
        const destination = this._effectiveDestination;
        const effectiveDestination = destination
            ? Object.freeze({
                ...destination,
                localPosition: Object.freeze([...destination.localPosition]),
                globalPosition: Object.freeze([...destination.globalPosition]),
            })
            : null;
        const readContext = this._captureReadContext();

        return Object.freeze({
            ...readContext,
            selectedAction: this.selectedAction,
            effectiveDestination,
        });
    }

    get acceptsDrop() {
        return this._route !== Enums.DndOfferRoute.UNSUPPORTED;
    }

    get supportedDropActions() {
        return Gdk.DragAction.MOVE |
            Gdk.DragAction.COPY |
            Gdk.DragAction.LINK |
            Gdk.DragAction.ASK;
    }

    get selectedAction() {
        let action = this._drop.get_actions();

        if (!Gdk.DragAction.is_unique(action) &&
            action > (Gdk.DragAction.COPY | Gdk.DragAction.MOVE))
            action = Gdk.DragAction.ASK;

        return action;
    }

    get drop() {
        return this._drop;
    }

    get route() {
        return this._route;
    }
};
