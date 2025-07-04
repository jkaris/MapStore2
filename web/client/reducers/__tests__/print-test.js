/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import expect from 'expect';

import print from '../print';

import {
    SET_PRINT_PARAMETER,
    PRINT_CAPABILITIES_LOADED,
    PRINT_CAPABILITIES_ERROR,
    CONFIGURE_PRINT_MAP,
    CHANGE_PRINT_ZOOM_LEVEL,
    CHANGE_MAP_PRINT_PREVIEW,
    PRINT_SUBMITTING,
    PRINT_CREATED,
    PRINT_ERROR,
    PRINT_CANCEL
} from '../../actions/print';

describe('Test the print reducer', () => {
    it('set a printing parameter', () => {
        const state = print({spec: {}}, {
            type: SET_PRINT_PARAMETER,
            name: 'param',
            value: 'val'
        });
        expect(state.spec.param).toBe('val');
    });

    it('set a nested printing parameter', () => {
        const state = print({spec: {}}, {
            type: SET_PRINT_PARAMETER,
            name: 'path.param',
            value: 'val'
        });
        expect(state.spec.path.param).toBe('val');
    });

    it('load capabilities', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: PRINT_CAPABILITIES_LOADED,
            capabilities: {
                layouts: [{name: 'A4'}],
                dpis: [{value: 96}]
            }
        });
        expect(state.capabilities.layouts.length).toBe(1);
        expect(state.capabilities.dpis.length).toBe(1);
        expect(state.spec.sheet).toBe('A4');
        expect(state.spec.resolution).toBe(96);
    });

    it('load capabilities do not override sheet', () => {
        const state = print({ capabilities: {}, spec: {sheet: 'A3'} }, {
            type: PRINT_CAPABILITIES_LOADED,
            capabilities: {
                layouts: [{ name: 'A4' }, {name: 'A3'}],
                dpis: [{ value: 96 }]
            }
        });
        expect(state.capabilities.layouts.length).toBe(2);
        expect(state.capabilities.dpis.length).toBe(1);
        expect(state.spec.sheet).toBe('A3');
        expect(state.spec.resolution).toBe(96);
    });

    it('load capabilities override sheet if user defined does not exist', () => {
        const state = print({ capabilities: {}, spec: { sheet: 'A3' } }, {
            type: PRINT_CAPABILITIES_LOADED,
            capabilities: {
                layouts: [{ name: 'A4' }],
                dpis: [{ value: 96 }]
            }
        });
        expect(state.capabilities.layouts.length).toBe(1);
        expect(state.capabilities.dpis.length).toBe(1);
        expect(state.spec.sheet).toBe('A4');
        expect(state.spec.resolution).toBe(96);
    });

    it('load capabilities error', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: PRINT_CAPABILITIES_ERROR,
            error: 'myerror'
        });
        expect(state.error).toBe('myerror');
    });

    it('configure print map', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: CONFIGURE_PRINT_MAP,
            center: {x: 1, y: 1},
            zoom: 5,
            scaleZoom: 6,
            scale: 10000,
            layers: [],
            projection: 'EPSG:4326'
        });
        expect(state.map).toExist();
        expect(state.map.center).toExist();
        expect(state.map.center.x).toBe(1);
        expect(state.map.zoom).toBe(5);
        expect(state.map.scale).toBe(10000);
        expect(state.map.layers.length).toBe(0);
        expect(state.map.projection).toBe('EPSG:4326');
    });
    it('configure print map with useFixedScales = true', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: CONFIGURE_PRINT_MAP,
            center: {x: 1, y: 1},
            zoom: 5,
            scaleZoom: 6,
            scale: 10000,
            layers: [],
            projection: 'EPSG:4326',
            useFixedScales: true
        });
        expect(state.map).toExist();
        expect(state.map.center).toExist();
        expect(state.map.center.x).toBe(1);
        expect(state.map.zoom).toBe(5);
        expect(state.map.scale).toBe(10000);
        expect(state.map.layers.length).toBe(0);
        expect(state.map.projection).toBe('EPSG:4326');
        expect(state.map.useFixedScales).toBe(true);
    });
    it('configure print map with editScale = true', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: CONFIGURE_PRINT_MAP,
            center: {x: 1, y: 1},
            zoom: 5,
            scaleZoom: 6,
            scale: 10000,
            layers: [],
            projection: 'EPSG:4326',
            useFixedScales: true,
            editScale: true
        });
        expect(state.map).toExist();
        expect(state.map.center).toExist();
        expect(state.map.center.x).toBe(1);
        expect(state.map.zoom).toBe(5);
        expect(state.map.scale).toBe(10000);
        expect(state.map.layers.length).toBe(0);
        expect(state.map.projection).toBe('EPSG:4326');
        expect(state.map.useFixedScales).toBe(true);
        expect(state.map.editScale).toBe(true);
    });
    it('configure print map title', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: CONFIGURE_PRINT_MAP,
            center: {x: 1, y: 1},
            zoom: 5,
            scaleZoom: 6,
            scale: 10000,
            layers: [{
                title: {
                    'default': 'Layer',
                    'it-IT': 'Livello'
                }
            }],
            projection: 'EPSG:4326'
        });
        expect(state.map).toExist();
        expect(state.map.center).toExist();
        expect(state.map.center.x).toBe(1);
        expect(state.map.zoom).toBe(5);
        expect(state.map.scale).toBe(10000);
        expect(state.map.layers.length).toBe(1);
        expect(state.map.layers[0].title).toBe('Layer');
        expect(state.map.projection).toBe('EPSG:4326');
    });

    it('change print zoom level', () => {
        const state = print({capabilities: {}, spec: {}, map: {
            zoom: 5,
            scaleZoom: 6
        }}, {
            type: CHANGE_PRINT_ZOOM_LEVEL,
            zoom: 8,
            scale: 10000
        });
        expect(state.map).toExist();
        expect(state.map.zoom).toBe(7);
        expect(state.map.scaleZoom).toBe(8);
    });
    it('change print zoom level with resolution', () => {
        const state = print({capabilities: {}, spec: {}, map: {
            zoom: 5,
            scaleZoom: 6
        }}, {
            type: CHANGE_PRINT_ZOOM_LEVEL,
            zoom: 8,
            scale: 10000,
            resolution: 123456
        });
        expect(state.map).toExist();
        expect(state.map.zoom).toBe(7);
        expect(state.map.scaleZoom).toBe(8);
        expect(state.map.mapResolution).toBe(123456);
    });
    it('change map print preview', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: CHANGE_MAP_PRINT_PREVIEW,
            size: 1000,
            center: {
                "x": 15.935325658757531,
                "y": 42.729598714490606,
                "crs": "EPSG:4326"
            },
            zoom: 6
        });
        expect(state.map).toExist();
        expect(state.map.size).toEqual(1000);
        expect(state.map.zoom).toEqual(6);
        expect(state.map.scaleZoom).toEqual(6);
        expect(state.map.center).toEqual({
            "x": 15.935325658757531,
            "y": 42.729598714490606,
            "crs": "EPSG:4326"
        });
    });
    it('change map print preview with resolution value', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: CHANGE_MAP_PRINT_PREVIEW,
            size: 1000,
            center: {
                "x": 15.935325658757531,
                "y": 42.729598714490606,
                "crs": "EPSG:4326"
            },
            zoom: 6,
            resolution: 123456
        });
        expect(state.map).toExist();
        expect(state.map.size).toEqual(1000);
        expect(state.map.zoom).toEqual(6);
        expect(state.map.scaleZoom).toEqual(6);
        expect(state.map.center).toEqual({
            "x": 15.935325658757531,
            "y": 42.729598714490606,
            "crs": "EPSG:4326"
        });
        expect(state.map.mapResolution).toEqual(123456);
    });
    it('print submitting', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: PRINT_SUBMITTING
        });
        expect(state.isLoading).toBe(true);
    });
    it('print created', () => {
        const state = print({capabilities: {}, spec: {}, isLoading: true}, {
            type: PRINT_CREATED,
            url: 'myurl'
        });
        expect(state.isLoading).toBe(false);
        expect(state.pdfUrl).toBe('myurl');
    });

    it('print error', () => {
        const state = print({capabilities: {}, spec: {}, isLoading: true}, {
            type: PRINT_ERROR,
            error: 'error'
        });
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('error');
    });

    it('print cancel', () => {
        const state = print({capabilities: {}, spec: {}, pdfUrl: 'myurl'}, {
            type: PRINT_CANCEL
        });
        expect(state.pdfUrl).toNotExist();
    });

    it('configure print map title with current locale', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: CONFIGURE_PRINT_MAP,
            center: {x: 1, y: 1},
            zoom: 5,
            scaleZoom: 6,
            scale: 10000,
            layers: [{
                title: {
                    'default': 'Layer',
                    'it-IT': 'Livello'
                }
            }],
            projection: 'EPSG:4326',
            currentLocale: 'it-IT'
        });
        expect(state.map).toExist();
        expect(state.map.center).toExist();
        expect(state.map.center.x).toBe(1);
        expect(state.map.zoom).toBe(5);
        expect(state.map.scale).toBe(10000);
        expect(state.map.layers.length).toBe(1);
        expect(state.map.layers[0].title).toBe('Livello');
        expect(state.map.projection).toBe('EPSG:4326');
    });

    it('configure print map title with current locale and no data', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: CONFIGURE_PRINT_MAP,
            center: {x: 1, y: 1},
            zoom: 5,
            scaleZoom: 6,
            scale: 10000,
            layers: [{
                title: {
                    'default': 'Layer',
                    'it-IT': 'Livello'
                }
            }],
            projection: 'EPSG:4326',
            currentLocale: 'en-US'
        });
        expect(state.map).toExist();
        expect(state.map.center).toExist();
        expect(state.map.center.x).toBe(1);
        expect(state.map.zoom).toBe(5);
        expect(state.map.scale).toBe(10000);
        expect(state.map.layers.length).toBe(1);
        expect(state.map.layers[0].title).toBe('Layer');
        expect(state.map.projection).toBe('EPSG:4326');
    });

    it('configure print map title with current locale and no object title', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: CONFIGURE_PRINT_MAP,
            center: {x: 1, y: 1},
            zoom: 5,
            scaleZoom: 6,
            scale: 10000,
            layers: [{
                title: 'Layer001'
            }],
            projection: 'EPSG:4326',
            currentLocale: 'en-US'
        });
        expect(state.map).toExist();
        expect(state.map.center).toExist();
        expect(state.map.center.x).toBe(1);
        expect(state.map.zoom).toBe(5);
        expect(state.map.scale).toBe(10000);
        expect(state.map.layers.length).toBe(1);
        expect(state.map.layers[0].title).toBe('Layer001');
        expect(state.map.projection).toBe('EPSG:4326');
    });
    it('configure print map with editScale and mapResolution', () => {
        const state = print({capabilities: {}, spec: {}}, {
            type: CONFIGURE_PRINT_MAP,
            center: {x: 1, y: 1},
            zoom: 5,
            scaleZoom: 6,
            scale: 10000,
            layers: [{
                title: 'Layer001'
            }],
            projection: 'EPSG:4326',
            editScale: true,
            mapResolution: 123456
        });
        expect(state.map).toExist();
        expect(state.map.center).toExist();
        expect(state.map.center.x).toBe(1);
        expect(state.map.zoom).toBe(5);
        expect(state.map.scale).toBe(10000);
        expect(state.map.layers.length).toBe(1);
        expect(state.map.layers[0].title).toBe('Layer001');
        expect(state.map.projection).toBe('EPSG:4326');
        expect(state.map.editScale).toEqual(true);
        expect(state.map.mapResolution).toEqual(123456);
    });
    it('default legend options', () => {
        const state = print(undefined, {});
        expect(state.spec.iconsWidth).toBe(24);
        expect(state.spec.iconsWidth).toBe(24);
        expect(state.spec.forceIconsSize).toBeFalsy();
    });
});
