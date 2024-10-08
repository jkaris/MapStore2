/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import expect from 'expect';

import React from 'react';
import ReactDOM from 'react-dom';
import Localized from '../Localized';
import Message from '../Message';
import HTML from '../HTML';

const messages = {
    "testMsg": "my message"
};

describe('Test the localization support HOC', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('localizes wrapped Message component', () => {
        var localized = ReactDOM.render(
            <Localized locale="it-IT" messages={messages}>
                {() => <Message msgId="testMsg"/> }
            </Localized>
            , document.getElementById("container"));
        var dom = ReactDOM.findDOMNode(localized);
        expect(dom).toExist();
        expect(dom.innerHTML).toBe("my message");
    });

    it('correctly sets the document language', () => {
        ReactDOM.render(
            <Localized locale="it-IT" messages={messages}>
                {() => <Message msgId="testMsg"/> }
            </Localized>
            , document.getElementById("container"));
        expect(document.documentElement.lang).toBe("it-IT");
        ReactDOM.render(
            <Localized locale="de-DE" messages={messages}>
                {() => <Message msgId="testMsg"/> }
            </Localized>
            , document.getElementById("container"));
        expect(document.documentElement.lang).toBe("de-DE");
    });

    it('localizes wrapped HTML component', () => {
        var localized = ReactDOM.render(
            <Localized locale="it-IT" messages={messages}>
                {() => <HTML msgId="testMsg"/> }
            </Localized>
            , document.getElementById("container"));
        var dom = ReactDOM.findDOMNode(localized);
        expect(dom).toExist();
        expect(dom.innerHTML).toBe("my message");
    });

    it('tests localized component without messages', () => {
        var localized = ReactDOM.render(
            <Localized locale="it-IT">
                {() => <HTML msgId="testMsg"/> }
            </Localized>
            , document.getElementById("container"));
        var dom = ReactDOM.findDOMNode(localized);
        expect(dom).toNotExist();
    });

    it('renders a loading error', () => {
        var localized = ReactDOM.render(<Localized loadingError="loadingError" />, document.getElementById("container"));
        var dom = ReactDOM.findDOMNode(localized);
        expect(dom).toExist();
        expect(dom.className.indexOf("loading-locale-error")).toNotBe(-1);
    });
});
