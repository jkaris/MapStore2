/*
* Copyright 2017, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import PropTypes from 'prop-types';
import assign from 'object-assign';
import {connect} from 'react-redux';
import { compose } from 'recompose';
import ConfigUtils from '../utils/ConfigUtils';
import Message from "../components/I18N/Message";

import mapsEpics from '../epics/maps';
import {userRoleSelector} from '../selectors/security';
import {versionSelector} from '../selectors/version';
import { totalCountSelector } from '../selectors/maps';
import { isFeaturedMapsEnabled } from '../selectors/featuredmaps';
import emptyState from '../components/misc/enhancers/emptyState';
import {createSelector} from 'reselect';

import MapsGrid from './maps/MapsGrid';
import PaginationToolbarBase from '../components/misc/PaginationToolbar';

import EmptyMaps from './maps/EmptyMaps';

import {loadMaps} from '../actions/maps';

import mapsReducer from '../reducers/maps';

const mapsCountSelector = createSelector(
    totalCountSelector,
    count => ({ count })
);


const PaginationToolbar = connect((state) => {
    if (!state.maps ) {
        return {};
    }
    let {start, limit, results, loading, totalCount, searchText} = state.maps;
    const total = Math.min(totalCount || 0, limit || 0);
    const page = results && total && Math.ceil(start / total) || 0;
    return {
        page: page,
        pageSize: limit,
        items: results,
        total: totalCount,
        searchText,
        loading
    };
}, {onSelect: loadMaps}, (stateProps, dispatchProps) => {

    return {
        ...stateProps,
        onSelect: (pageNumber) => {
            let start = stateProps.pageSize * pageNumber;
            let limit = stateProps.pageSize;
            dispatchProps.onSelect(ConfigUtils.getDefaults().geoStoreUrl, stateProps.searchText, {start, limit});
        }
    };
})(PaginationToolbarBase);

class Maps extends React.Component {
    static propTypes = {
        title: PropTypes.any,
        onGoToMap: PropTypes.func,
        loadMaps: PropTypes.func,
        showMapDetails: PropTypes.bool,
        maps: PropTypes.array,
        searchText: PropTypes.string,
        mapsOptions: PropTypes.object,
        colProps: PropTypes.object,
        version: PropTypes.string,
        fluid: PropTypes.bool,
        showAPIShare: PropTypes.bool,
        shareToolEnabled: PropTypes.bool,
        emptyView: PropTypes.object
    };

    static contextTypes = {
        router: PropTypes.object
    };

    static defaultProps = {
        onGoToMap: () => {},
        loadMaps: () => {},
        fluid: false,
        title: <h3><Message msgId="manager.maps_title" /></h3>,
        mapsOptions: {start: 0, limit: 12},
        colProps: {
            xs: 12,
            sm: 6,
            lg: 3,
            md: 4,
            className: 'ms-map-card-col'
        },
        maps: [],
        showAPIShare: true,
        shareToolEnabled: true,
        emptyView: {}
    };

    render() {
        return (<MapsGrid
            resources={this.props.maps}
            fluid={this.props.fluid}
            title={this.props.title}
            colProps={this.props.colProps}
            viewerUrl={(map = {}) => {
                if (map.contextName) {
                    this.context.router.history.push("/context/" + map.contextName + "/" + map.id);
                } else {
                    this.context.router.history.push("/viewer/" + map.id);
                }
            }}
            getShareUrl={(map) => map.contextName ? `context/${map.contextName}/${map.id}` : `viewer/${map.id}`}
            shareApi={this.props.showAPIShare}
            version={this.props.version}
            shareToolEnabled={this.props.shareToolEnabled}
            bottom={<PaginationToolbar />}
        />);
    }
}

const mapsPluginSelector = createSelector([
    state => state.maps && state.maps.searchText,
    state => state.maps && state.maps.results ? state.maps.results : [],
    state => state.maps && state.maps.loading,
    isFeaturedMapsEnabled,
    userRoleSelector,
    versionSelector
], (searchText, maps, loading, featuredEnabled, role, version) => ({
    searchText,
    version,
    maps: maps.map(map => ({...map, featuredEnabled: featuredEnabled && role === 'ADMIN'})),
    loading
}));

const MapsPlugin = compose(
    connect(mapsPluginSelector, {
        loadMaps
    }),
    emptyState(
        ({maps = [], loading}) => !loading && maps.length === 0,
        ({showCreateButton = true, emptyView}) => ({
            glyph: "1-map",
            title: <Message msgId="resources.maps.noMapAvailable" />,
            content: <EmptyMaps showCreateButton={showCreateButton} />,
            iconFit: true,
            imageStyle: {
                height: emptyView?.iconHeight ?? '200px'
            }
        })
    )
)(Maps);

/**
 * Plugin for maps resources browsing.
 * Can be rendered inside {@link #plugins.ContentTabs|ContentTabs} plugin
 * and adds an entry to the {@link #plugins.NavMenu|NavMenu}
 * @deprecated
 * @ignore
 * @name Maps
 * @memberof plugins
 * @class
 * @prop {boolean} cfg.showCreateButton default true. Flag to show/hide the button "create a new one" when there is no dashboard yet.
 * @prop {boolean} cfg.shareToolEnabled default true. Flag to show/hide the "share" button on the item.
 * @prop {boolean} cfg.emptyView.iconHeight default "200px". Value to override default icon maximum height.
 */
export default {
    MapsPlugin: assign(MapsPlugin, {
        NavMenu: {
            position: 2,
            label: <Message msgId="manager.maps_title" />,
            linkId: '#mapstore-maps-grid',
            glyph: '1-map'
        },
        ContentTabs: {
            name: 'maps',
            key: 'maps',
            TitleComponent:
                connect(mapsCountSelector)(({ count = "" }) => <Message msgId="resources.maps.title" msgParams={{ count: count + "" }} />),
            position: 1,
            tool: true,
            priority: 1
        }
    }),
    epics: {
        ...mapsEpics
    },
    reducers: {
        maps: mapsReducer
    }
};
