/**
 * Copyright 2015-2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';

import UDModal from '../UserDetailsModal';

describe("Test user details modal", () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('creates component with defaults', () => {
        const cmp = ReactDOM.render(<UDModal />, document.getElementById("container"));
        expect(cmp).toExist();
    });

    it('creates component to show', () => {
        const cmp = ReactDOM.render(<UDModal show user={{user: {name: "user"}}}/>, document.getElementById("container"));
        expect(cmp).toExist();
    });

    it('creates component with attributes', () => {
        let testUser = {
            "attribute": [
                {
                    "name": "company",
                    "value": "Some Company"
                },
                {
                    "name": "email",
                    "value": "user@email.com"
                },
                {
                    "name": "notes",
                    "value": "some notes"
                },
                {
                    "name": "UUID",
                    "value": "260a670e-4dc0-4719-8bc9-85555d7dcbe1"
                }
            ],
            "enabled": true,
            "groups": {
                "group": {
                    "enabled": true,
                    "groupName": "everyone",
                    "id": 3
                }
            },
            "id": 6,
            "name": "admin",
            "role": "ADMIN"
        };
        let displayAttributes = (attr) => {
            return attr.name && attr.name === "email" || attr.name === "company";
        };
        const cmp = ReactDOM.render(<UDModal options={{animation: false}} show displayAttributes={displayAttributes} user={testUser}/>, document.getElementById("container"));
        expect(cmp).toExist();
        const modalDOM = document.getElementsByClassName('ms-resizable-modal')[0];

        expect(modalDOM.getElementsByClassName('row').length).toEqual(6);
    });
    it('test hide group user info if hideGroupUserInfo = true', () => {
        let testUser = {
            "attribute": [
                {
                    "name": "company",
                    "value": "Some Company"
                },
                {
                    "name": "email",
                    "value": "user@email.com"
                },
                {
                    "name": "notes",
                    "value": "some notes"
                },
                {
                    "name": "UUID",
                    "value": "260a670e-4dc0-4719-8bc9-85555d7dcbe1"
                }
            ],
            "enabled": true,
            "groups": {
                "group": {
                    "enabled": true,
                    "groupName": "everyone",
                    "id": 3
                }
            },
            "id": 6,
            "name": "admin",
            "role": "ADMIN"
        };
        let displayAttributes = (attr) => {
            return attr.name && attr.name === "email" || attr.name === "company";
        };
        const cmpNormal = ReactDOM.render(<UDModal options={{animation: false}} show displayAttributes={displayAttributes} user={testUser}/>, document.getElementById("container"));
        expect(cmpNormal).toExist();
        const modalDOMNormal = document.getElementsByClassName('ms-resizable-modal')[0];
        expect(modalDOMNormal.querySelector('.user-group-info')).toExist();             // includes group info

        const cmpWithHide = ReactDOM.render(<UDModal hideGroupUserInfo options={{animation: false}} show displayAttributes={displayAttributes} user={testUser}/>, document.getElementById("container"));
        expect(cmpWithHide).toExist();
        const modalDOM = document.getElementsByClassName('ms-resizable-modal')[0];
        expect(modalDOM.querySelector('.user-group-info')).toNotExist();                   // not include group info
    });
});
