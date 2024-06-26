/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Glyphicon as GlyphiconRB } from 'react-bootstrap';

import Message from '../I18N/Message';
import BorderLayout from '../layout/BorderLayout';
import SideGridComp from '../misc/cardgrids/SideGrid';
import emptyState from '../misc/enhancers/emptyState';
import withLocal from '../misc/enhancers/localizedProps';
import tooltip from '../misc/enhancers/tooltip';
import FilterComp from '../misc/Filter';
import SVGPreview from './SVGPreview';
import {resetLayerLegendFilter} from '../../utils/FilterUtils';

const Filter = withLocal('filterPlaceholder')(FilterComp);

const Glyphicon = tooltip(GlyphiconRB);

const SideGrid = emptyState(
    ({items}) => items.length === 0,
    {
        title: <Message msgId="styleeditor.filterMatchNotFound"/>,
        glyph: '1-stilo'
    }
)(SideGridComp);

// get the text to use in the icon
const getFormatText = (format) => {
    const text = {
        sld: 'SLD',
        css: 'CSS',
        mbstyle: 'MBS'
    };
    return text[format] || format || '';
};

/**
 * Component for rendering a grid of style templates.
 * @memberof components.styleeditor
 * @name StyleList
 * @class
 * @prop {bool} showDefaultStyleIcon show icon near default style
 * @prop {string} enabledStyle name of style in use
 * @prop {string} defaultStyle name of default style
 * @prop {array} availableStyles array of all available styles, eg: [{TYPE_NAME: "WMS_1_3_0.Style", filename: "style.sld", format: "sld", languageVersion: {version: "1.0.0"}, legendURL: [{…}], name: "point", title: "Title", _abstract: ""}]
 * @prop {function} onSelect triggered by clicking on cards, arg. {style}
 * @prop {string} formatColors object of colors, key should be the format name and value an hexadecimal color, it changes color of text in preview
 * @prop {string} filterText
 * @prop {function} onFilter arg. text value from input filter
 */

const StyleList = ({
    showDefaultStyleIcon,
    enabledStyle,
    defaultStyle,
    availableStyles = [],
    onSelect = () => {},
    layer = {},
    formatColors = {
        sld: "#33ffaa",
        css: "#ffaa33"
    },
    filterText = "",
    onFilter = () => {}
}) => (
    <BorderLayout
        className="ms-style-editor-list"
        header={
            <Filter
                filterPlaceholder="styleeditor.styleListfilterPlaceholder"
                filterText={filterText}
                onFilter={onFilter}
            />
        }
    >
        <SideGrid
            size="sm"
            onItemClick={({ name }) => {
                const isLayerFilterUpdated = resetLayerLegendFilter(layer, 'style', name);
                // check if LayerFilterUpdated = falsy value --> this means there isn't a prev legend filter to reset
                // else --> legend filter needs to reset
                if (isLayerFilterUpdated) {
                    onSelect( { layerFilter: isLayerFilterUpdated, style: name }, true );
                    return;
                }
                onSelect({ style: name }, true);
            }}
            items={availableStyles
                .filter(
                    ({
                        name = "",
                        title = "",
                        _abstract = "",
                        metadata = {}
                    }) =>
                        name.toLowerCase().includes(filterText.toLowerCase())
                        ||
                        metadata?.title?.toLowerCase().includes(filterText.toLowerCase()) ||
                        metadata?.description?.toLowerCase().includes(filterText.toLowerCase())
                        ||
                        title
                            .toLowerCase()
                            .includes(filterText.toLowerCase()) ||
                        _abstract
                            .toLowerCase()
                            .includes(filterText.toLowerCase())
                )
                .map((style) => ({
                    ...style,
                    title:
                        style?.metadata?.title ||
                        style.label ||
                        style.title ||
                        style.name,
                    description:
                        style?.metadata?.description || style._abstract,
                    selected: enabledStyle === style.name,
                    preview: (style.format && (
                        <SVGPreview
                            backgroundColor="#333333"
                            texts={[
                                {
                                    text: getFormatText(
                                        style.format
                                    ).toUpperCase(),
                                    fill:
                                        formatColors[style.format] || "#f2f2f2",
                                    style: {
                                        fontSize: 70,
                                        fontWeight: "bold"
                                    }
                                }
                            ]}
                        />
                    )) || <Glyphicon glyph="geoserver" />,
                    tools:
                        showDefaultStyleIcon && defaultStyle === style.name ? (
                            <Glyphicon
                                glyph="star"
                                tooltipId="styleeditor.defaultStyle"
                            />
                        ) : null
                }))}
        />
    </BorderLayout>
);

export default StyleList;
