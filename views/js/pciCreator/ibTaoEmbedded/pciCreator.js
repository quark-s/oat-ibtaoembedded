/*
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA;
 *
 */
define([
    'lodash',
    'ibTaoEmbedded/creator/widget/Widget',
    'tpl!ibTaoEmbedded/creator/tpl/markup',
    'ibTaoEmbedded/runtime/js/itemManager'
], function(_, Widget, markupTpl, itmMgr){
    'use strict';

    var _typeIdentifier = 'ibTaoEmbedded';

    var ibTaoEmbeddedCreator = {
         /**
         * (required) Get the typeIdentifier of the custom interaction
         * 
         * @returns {String}
         */
          getTypeIdentifier : function(){
            return _typeIdentifier;
        },
        /**
         * (required) Get the widget prototype
         * Used in the renderer
         * 
         * @returns {Object} Widget
         */
        getWidget : function(){
            return Widget;
        },
        /**
         * (optional) Get the default properties values of the pci.
         * Used on new pci instance creation
         * 
         * @returns {Object}
         */
        getDefaultProperties : function(pci){
            let _default = {alignh: "left", navigationLock: true, fullscreen: true};
            let _conf = Object.assign(itmMgr.getConf(), _default);
            return _conf;
        },
        /**
         * (optional) Callback to execute on the 
         * Used on new pci instance creation
         * 
         * @returns {Object}
         */
        afterCreate : function(pci){
            //always set the NONE response processing mode to likert scale
            pci.getResponseDeclaration().setTemplate('NONE');
        },
        /**
         * (required) Gives the qti pci xml template 
         * 
         * @returns {function} handlebar template
         */
        getMarkupTemplate : function(){
            return markupTpl;
        },
        /**
         * (optional) Allows passing additional data to xml template
         * 
         * @returns {function} handlebar template
         */
        getMarkupData : function(pci, defaultData){
            defaultData.prompt = pci.data('prompt');
            defaultData.url = this.getDefaultProperties().url;
            return defaultData;
        }
    };

    //since we assume we are in a tao context, there is no use to expose the a global object for lib registration
    //all libs should be declared here
    return ibTaoEmbeddedCreator;
});