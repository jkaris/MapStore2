/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { find, isEqual, omit } from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {branch, compose, createEventHandler, mapPropsStream, withHandlers, withProps, withPropsOnChange, withStateHandlers} from 'recompose';
import {createSelector} from 'reselect';
import uuid from "uuid";

import {getCurrentFocusedContentEl, isFocusOnContentSelector, resourcesSelector} from '../../../../selectors/geostory';
import {createMapObject} from '../../../../utils/GeoStoryUtils';
import Message from '../../../I18N/Message';
import ToolbarButton from '../../../misc/toolbar/ToolbarButton';
import withConfirm from '../../../misc/withConfirm';
import withNodeSelection from '../../../widgets/builder/wizard/map/enhancers/handleNodeSelection';

const ConfirmButton = withConfirm(ToolbarButton);

/**
 * create a map property merging a resource map and a content map obj
 * resourceId a and map should be present in props
 */
export default compose(
    connect(
        createSelector(
            resourcesSelector,
            isFocusOnContentSelector,
            (resources, isContentFocused) => ({
                resources,
                isContentFocused
            }))),
    withProps(
        ({ resources, resourceId, map = {}}) => {
            const resource = find(resources, { id: resourceId }) || {};
            const baseMap = omit(resource.data, ['context']);
            const isLegacyGeostory = (map?.layers || [])?.indexOf(null) !== -1 || (map?.groups || [])?.indexOf(null) !== -1;
            const cleanedMap = {...map, layers: (map.layers || baseMap?.layers || []).map(lay => lay ? lay : undefined), groups: (map.groups || baseMap?.groups || []).map(gr => gr ? gr : undefined)};         // for better initiating cleanedMap layers in case 'map.layers = undefined' -> baseMap.layers check is added in fallBack
            return { map: createMapObject(baseMap, cleanedMap, isLegacyGeostory)};
        }
    ));
/**
 * Adds resourceId and content map props needed to connect the mapEditor to the map.
 * Adds disableReset prop when map hasn't been modified
 */
export const withFocusedContentMap = compose(
    connect(createSelector(getCurrentFocusedContentEl, (focusedEl = {}) => ({focusedEl }))), // Map connection and update withFocusedMap
    withProps(
        ({ focusedEl: {resourceId, map} = {}}) => {
            return { map: map || {},  resourceId, disableReset: !map };
        }
    ));
/**
 * It Adjusts the path to update content map config obj
 */
export const handleMapUpdate = withHandlers({
    onChangeMap: ({update, focusedContent = {}}) =>
        (path, value, mode = "merge") => {
            update(`${focusedContent.path}.map.${path}`, value, mode);
        },
    onChange: ({update, focusedContent = {}}) =>
        (path, value, mode = 'merge') => {
            update(focusedContent.path + `.${path}`, value, mode);
        }
});

/**
 * Handle edit map toggle, map rest and open AdvancedMapEditor.
 * Map reset restores the original resource map configuration by removing all content map configs
 */
export const handleToolbar = withHandlers({
    toggleEditing: ({editMap, update, focusedContent}) => () =>
        update(focusedContent.path + ".editMap", !editMap),
    onReset: ({update, focusedContent: {path = ""} = {}}) => () => {
        update(path + `.map`, undefined);
    }
});
/**
 * It adds toolbar button and handling of layer selection
 */
const ResetButton = (props) => (<ConfirmButton
    glyph="repeat"
    bsStyle= "primary"
    className="square-button-md no-border"
    tooltipId="geostory.contentToolbar.resetMap"
    confirmTitle={<Message msgId="geostory.contentToolbar.resetMapConfirm" />}
    confirmContent={<Message msgId="geostory.contentToolbar.resetConfirmContent" />}
    {...props}
/>);

export const withToolbar = compose(
    withProps(({disableReset, onReset, buttonItems = [], map}) => ({
        buttons: [{
            renderButton: <ResetButton disabled={disableReset} onClick={onReset}/>
        },
        ...buttonItems.map(({Component}) => ({renderButton: <Component map={map} />}))]
    })),
    withNodeSelection,      // Node selection
    withStateHandlers(() => ({'editNode': undefined}), { // Node enable editing
        setEditNode: () => node => ({'editNode': node}),
        closeNodeEditor: () => () => ({'editNode': undefined})
    }),
    branch( // Setting node buttons
        ({editNode}) => !!editNode,
        withProps(({ selectedNodes = [], closeNodeEditor = () => {}}) => ({
            buttons: [{
                visible: selectedNodes.length === 1,
                tooltipId: "close",
                glyph: "1-close",
                onClick: closeNodeEditor
            }]
        })),
        withProps(({ selectedNodes = [], setEditNode = () => { }, buttons = [] }) => ({
            buttons: [{
                visible: selectedNodes.length === 1,
                glyph: "wrench",
                tooltipId: "toc.toolLayerSettingsTooltip",
                onClick: () => {setEditNode(selectedNodes[0]);}
            }, ...buttons]
        }))));


/**
* Add save changes logic.
*/
export const withSaveChanges = compose(
    withPropsOnChange(["focusedContent"], ({map, focusedEl: {map: contentMap} = {} } ) => ({contentMap, lastSavedMap: map})),
    withPropsOnChange(["map"], ({map, lastSavedMap}) => {
        return {pendingChanges: !isEqual(lastSavedMap, map)};
    })
);
/**
* Add close confirm if there are some pending changes
*/
export const withConfirmClose = compose(
    withProps(({toggleEditing})  => ({
        CloseBtn: (props) => (
            <ToolbarButton  onClick={toggleEditing} {...props} />)
    }))
);

/**
 * Add local map state management to map component
 */
export const withLocalMapState  = mapPropsStream(props$ => {
    const { stream: onMapViewChanges$, handler: onMapViewLocalChanges} = createEventHandler();
    return props$
        .pluck('map')
        .distinctUntilChanged((a, b ) => isEqual(a, b))
        .switchMap((map) => {
            return onMapViewChanges$.map((localMapState) => {
                return { map: {...map, ...localMapState}};
            }).startWith({map});
        })
        .combineLatest(props$, ({map} = {}, props = {}) => {
            return {
                ...props,
                onMapViewLocalChanges,
                map
            };
        });
});
// current implementation will update the map only if the movement
// between 12 decimals in the reference system to avoid rounded value
// changes due to float mathematic operations.
const isNearlyEqual = function(a, b) {
    if (a === undefined || b === undefined) {
        return false;
    }
    return a.toFixed(12) - b.toFixed(12) === 0;
};
/**
 * Handle editing, when mapEditing is true, map changes updates the geostory state, otherwise local map state is updated
 */
export const withMapEditingAndLocalMapState = withHandlers( {
    onMapViewChanges: ({update, editMap = false, onMapViewLocalChanges, map: {center: oCenter = {}, zoom: oZoom, mapStateSource: oMapStateSource, resolution: oResolution, resetPanAndZoom} = {}} = {}) => ({center = {}, zoom, mapStateSource, resolution}) => {
        const equalCenter =  isNearlyEqual(oCenter.x, center.x) && isNearlyEqual(oCenter.y, center.y);
        if ((editMap && !(equalCenter && oZoom === zoom))) {
            update("map", {center, zoom, mapStateSource: uuid(), resolution, resetPanAndZoom: false}, 'merge');
        } else if (resetPanAndZoom) {
            update("map", {center: oCenter, zoom: oZoom, mapStateSource: oMapStateSource, resolution: oResolution, resetPanAndZoom: false}, 'merge');
        } else {
            onMapViewLocalChanges({center, zoom, mapStateSource, resolution});
        }
    }
});
