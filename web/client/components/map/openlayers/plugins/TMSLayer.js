/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { get, isEqual } from 'lodash';
import axios from 'axios';
import XYZ from 'ol/source/XYZ';
import TileGrid from 'ol/tilegrid/TileGrid';
import TileLayer from 'ol/layer/Tile';

import Layers from '../../../../utils/openlayers/Layers';
import { getCredentials } from '../../../../utils/SecurityUtils';

const tileLoadFunction = options => (image, src) => {
    const storedProtectedService = getCredentials(options.security?.sourceId) || {};
    axios.get(src, {
        headers: {
            "Authorization": `Basic ${btoa(storedProtectedService.username + ":" + storedProtectedService.password)}`
        },
        responseType: 'blob'
    }).then(response => {
        image.getImage().src = URL.createObjectURL(response.data);
    }).catch(e => {
        image.getImage().src = null;
        console.error(e);
    });
};

function tileXYZToOpenlayersOptions(options = {}) {
    const { minx, miny, maxx, maxy } = get(options, "bbox.bounds", {});
    const sourceOpt = {
        projection: options.srs,
        url: `${options.tileMapUrl}/{z}/{x}/{-y}.${options.extension}`, // TODO use resolutions
        attributions: options.attribution ? [options.attribution] : []
    };
    if (options.security) {
        sourceOpt.tileLoadFunction = tileLoadFunction(options);
    }

    let source = new XYZ(sourceOpt);
    const defaultTileGrid = source.getTileGrid();

    if (options.forceDefaultTileGrid) {
        const defaultExtent = defaultTileGrid.getExtent();
        const newOrigin = [defaultExtent[0], defaultExtent[1]]; // minx, miny instead of top left corner, origin is bottom left.
        const newTileGrid = new TileGrid({
            // origin must be overridden because GeoServer uses the tile-set origin and OL uses by default extent corner.
            origin: newOrigin,
            extent: options.bbox && [minx, miny, maxx, maxy],
            resolutions: defaultTileGrid.getResolutions(),
            tileSize: options.tileSize
        });
        source.setTileGridForProjection(options.srs, newTileGrid);
        if (options.srs === "EPSG:3857") {
            source.setTileGridForProjection("EPSG:900913", newTileGrid);
        }
    } else if (options.tileSets) {
        source.setTileGridForProjection(options.srs, new TileGrid({
            origin: options.origin,
            extent: options.bbox && [minx, miny, maxx, maxy],
            resolutions: options.tileSets.map(({ resolution }) => resolution),
            tileSize: options.tileSize
        }));
    }
    let olOpt = {
        msId: options.id,
        extent: options.bbox && [minx, miny, maxx, maxy],
        opacity: options.opacity !== undefined ? options.opacity : 1,
        visible: options.visibility !== false,
        zIndex: options.zIndex,
        source: source,
        minResolution: options.minResolution,
        maxResolution: options.maxResolution
    };
    return olOpt;
}

Layers.registerType('tms', {
    create: (options) => {
        return new TileLayer(tileXYZToOpenlayersOptions(options));
    },
    update: (layer, newOptions, oldOptions) => {
        if (oldOptions.minResolution !== newOptions.minResolution) {
            layer.setMinResolution(newOptions.minResolution === undefined ? 0 : newOptions.minResolution);
        }
        if (oldOptions.maxResolution !== newOptions.maxResolution) {
            layer.setMaxResolution(newOptions.maxResolution === undefined ? Infinity : newOptions.maxResolution);
        }
        if (!isEqual(oldOptions.security, newOptions.security)) {
            layer.getSource().setTileLoadFunction(tileLoadFunction(newOptions));
        }
    }
});

