/*
* Copyright 2017, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

import assign from 'object-assign';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { createSelector } from 'reselect';

import { setDashboardsAvailable } from '../actions/dashboards';
import Message from '../components/I18N/Message';
import emptyState from '../components/misc/enhancers/emptyState';
import dashboards from '../epics/dashboards';
import dashboardsReducers from '../reducers/dashboards';
import { totalCountSelector } from '../selectors/dashboards';
import { isFeaturedMapsEnabled } from '../selectors/featuredmaps';
import { userRoleSelector } from '../selectors/security';
import DashboardGrid from './dashboard/DashboardsGrid';
import EmptyDashboardsView from './dashboard/EmptyDashboardsView';
import PaginationToolbar from './dashboard/PaginationToolbar';
import { DASHBOARD_DEFAULT_SHARE_OPTIONS } from '../utils/ShareUtils';

const dashboardsCountSelector = createSelector(
    totalCountSelector,
    count => ({ count })
);

/**
 * Plugin for Dashboards resources browsing.
 * Can be rendered inside {@link #plugins.ContentTabs|ContentTabs} plugin
 * and adds an entry to the {@link #plugins.NavMenu|NavMenu}
 * @deprecated
 * @ignore
 * @name Dashboards
 * @memberof plugins
 * @class
 * @prop {boolean} cfg.showCreateButton default true. Flag to show/hide the button "create a new one" when there is no dashboard yet.
 * @prop {object} cfg.shareOptions configuration applied to share panel
 * @prop {boolean} cfg.shareToolEnabled default true. Flag to show/hide the "share" button on the item.
 * @prop {boolean} cfg.emptyView.iconHeight default "200px". Value to override default icon maximum height.
 */
class Dashboards extends React.Component {
    static propTypes = {
        title: PropTypes.any,
        onMount: PropTypes.func,
        loadDashboards: PropTypes.func,
        resources: PropTypes.array,
        searchText: PropTypes.string,
        mapsOptions: PropTypes.object,
        colProps: PropTypes.object,
        fluid: PropTypes.bool,
        shareOptions: PropTypes.object,
        shareToolEnabled: PropTypes.bool,
        emptyView: PropTypes.object
    };

    static contextTypes = {
        router: PropTypes.object
    };

    static defaultProps = {
        onMount: () => {},
        loadDashboards: () => {},
        fluid: false,
        title: <h3><Message msgId="resources.dashboards.titleNoCount" /></h3>,
        mapsOptions: {start: 0, limit: 12},
        colProps: {
            xs: 12,
            sm: 6,
            lg: 3,
            md: 2,
            className: 'ms-map-card-col'
        },
        maps: [],
        shareOptions: DASHBOARD_DEFAULT_SHARE_OPTIONS,
        shareToolEnabled: true,
        emptyView: {}
    };

    componentDidMount() {
        this.props.onMount();
    }

    render() {
        return (<DashboardGrid
            resources={this.props.resources}
            fluid={this.props.fluid}
            title={this.props.title}
            colProps={this.props.colProps}
            viewerUrl={(dashboard) => {this.context.router.history.push(`dashboard/${dashboard.id}`); }}
            getShareUrl={dashboard => `dashboard/${dashboard.id}`}
            shareOptions={this.props.shareOptions}
            shareToolEnabled={this.props.shareToolEnabled}
            bottom={<PaginationToolbar />}
        />);
    }
}

const dashboardsPluginSelector = createSelector([
    state => state.dashboards && state.dashboards.searchText,
    state => state.dashboards && state.dashboards.results ? state.dashboards.results : [],
    isFeaturedMapsEnabled,
    userRoleSelector
], (searchText, resources, featuredEnabled, role) => ({
    searchText,
    resources: resources.map(res => ({...res, featuredEnabled: featuredEnabled && role === 'ADMIN'})) // TODO: remove false to enable featuredEnabled
}));

const DashboardsPlugin = compose(
    connect(dashboardsPluginSelector, {
        onMount: () => setDashboardsAvailable(true)
    }),
    emptyState(
        ({resources = [], loading}) => !loading && resources.length === 0,
        ({showCreateButton = true, emptyView}) => ({
            glyph: "dashboard",
            title: <Message msgId="resources.dashboards.noDashboardAvailable" />,
            description: <EmptyDashboardsView showCreateButton={showCreateButton}/>,
            iconFit: true,
            imageStyle: {
                height: emptyView?.iconHeight ?? '200px'
            }
        })

    )
)(Dashboards);

export default {
    DashboardsPlugin: assign(DashboardsPlugin, {
        NavMenu: {
            position: 2,
            label: <Message msgId="resources.dashboards.menuText" />,
            linkId: '#mapstore-maps-grid',
            glyph: 'dashboard'
        },
        ContentTabs: {
            name: 'dashboards',
            key: 'dashboards',
            TitleComponent:
                connect(dashboardsCountSelector)(({ count = ""}) => <Message msgId="resources.dashboards.title" msgParams={{ count: count + "" }} />),
            position: 2,
            tool: true,
            priority: 1
        }
    }),
    epics: dashboards,
    reducers: {
        dashboards: dashboardsReducers
    }
};
