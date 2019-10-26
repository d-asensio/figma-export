/* eslint-disable import/no-extraneous-dependencies */

const { expect } = chai;

const fs = require('fs');

const utils = require('./utils');

describe('utils.', () => {
    afterEach(() => {
        sinon.restore();
    });

    describe('mkdirRecursive', () => {
        it('should create a speficied folder recursively', () => {
            sinon.stub(fs, 'mkdirSync');

            utils.mkdirRecursive('folder/subfolder');

            expect(fs.mkdirSync).to.be.calledTwice;
            expect(fs.mkdirSync.firstCall).to.be.calledWithExactly('folder');
            expect(fs.mkdirSync.secondCall).to.be.calledWithExactly('folder/subfolder');
        });
    });
});
