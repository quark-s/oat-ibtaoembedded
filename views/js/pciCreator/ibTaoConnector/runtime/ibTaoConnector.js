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
define(['qtiCustomInteractionContext',
        'ibTaoConnector/runtime/js/jquery_2_1_1_amd',
        'ibTaoConnector/runtime/js/renderer',
        'ibTaoConnector/runtime/js/lzstring',
        'OAT/util/event',
        'taoItems/assets/manager',
        'taoItems/assets/strategies',
        'taoQtiItem/portableElementRegistry/assetManager/portableAssetStrategy',        
    ],
    function(qtiCustomInteractionContext, $, renderer, LZString, event,  assetManagerFactory, assetStrategies, portableAssetStrategy){
    'use strict';


    function ibTaoConnector(dom, config) {
        
            this.getResponse = function() {
                let _response = {};

                // _response['scoreRaw'] = this.responseRaw;
    
                if(this.response.size>0){
                    let score = {
                        hits: {}
                    }
                    this.response.forEach((_hit, _class) => {
                        score.hits[_class] = _hit
                    });
                    _response['score'] = score;
                }
    
                if(this.traceLogs.length>0){
                    // _response['logs'] = zipson.stringify(this.traceLogs);
                    _response['logs'] = this.traceLogs;
                }
    
                if(!_response['score'] && !_response['logs'])
                    return { base: null };
    
                return  {
                    base : {
                        // string : JSON.stringify(['test', '123']).replace(/"/g,"'")
                        // string : JSON.stringify(_response).replace(/"/g,"'")
                        string : LZString.compressToBase64(JSON.stringify(_response))
                    }
                }
            }

            this.oncompleted = function(){
                if(!!document.querySelector("section.content-wrapper").style)
                    document.querySelector("section.content-wrapper").style.overflow = "auto";            
                var $container = $(this.dom);
                $container.off().empty();                
            }

            this.off = this.oncompleted;

            console.log("-init-");
            var self = this;
            
            //add method on(), off() and trigger() to the current object
            event.addEventMgr(this);
            
            this.dom = dom;
            this.config = config || {};
            this.startTime = Date.now();

            this.response = new Map();
            this.responseRaw = [];
            this.traceLogs = [];
            this.iframe = null;

            let _iframe = this.dom.find("iframe");
            if(_iframe.length>0)
                this.iframe = _iframe[0];

            /********** get assessment configuration to determine end of sequence (now solved via postMessage) ***********/
            // fetch(config.url + "assessments/config.json", {
            //     method: "GET",
            //     cache: "no-cache",
            //     headers: {
            //         'Accept': 'application/json'
            //     }                    
            // })
            // .then(r => r.ok ? Promise.resolve(r) : Promise.reject(new Error(r.statusText)))            
            // .then(r => r.json())            
            // .then(r => {
            //     if(!!r)
            //         this.config = Object.assign(this.config, {assessments: r});
            // });            

            /****** hide next / skip buttons (workaround for navigationLock) ******/
			if(this.config?.navigationLock){
				document.querySelectorAll("[data-control='next-section'], [data-control='move-end'], [data-control='move-forward'], [data-control='skip-end']")
				.forEach(e => e.classList.add("hidden"));
			}           

            renderer.render(this.id, this.dom, this.config);

            //tell the rendering engine that I am ready
            qtiCustomInteractionContext.notifyReady(this);

            window.addEventListener('resize', e => {
                if(e.target == window && !self.config.fullscreen)
                    return;
                renderer.updateIframe(self.id, self.dom, self.config);
            });

            if(typeof ResizeObserver == "function"){
                const resizeObserver = new ResizeObserver((entries) => {
                    // We wrap it in requestAnimationFrame to avoid this error - ResizeObserver loop limit exceeded
                    window.requestAnimationFrame(() => {
                        if (!Array.isArray(entries) || !entries.length) {
                            return;
                        }
                        renderer.updateIframe(self.id, self.dom, self.config);
                    });                    
                    // renderer.updateIframe(self.id, self.dom, self.config);
                });
                resizeObserver.observe(this.dom[0]);
            }

            // window.onresize = e => {
            //     renderer.updateIframe(self.id, self.dom, self.config);
            // };


            this.on('urlchange', function(url){
                self.config.url = url || self.config.url;
                renderer.refreshSrc(self.id, self.dom, url);
                // self.scaleContents();
            });
            
            this.on('itempropchange', function(width, height, iwidth, iheight){
                width = parseInt(width);
                height = parseInt(height);
                iwidth = parseInt(iwidth);
                iheight = parseInt(iheight);
                if(
                    (self.config.width == width && self.config.height == height && self.config.iwidth == iwidth && self.config.iheight == iheight) || 
                    width < 100 ||
                    height < 100 ||
                    iwidth < 100 ||
                    iheight < 100 ||
                    width > 2560 ||
                    height > 1600 ||
                    iwidth > 2560 ||
                    iheight > 1600
                    ){
                        return;
                        // throw new Error("Dimensions out of range.")
                    }
                    
                self.config.width = width || self.config.width;
                self.config.height = height || self.config.height;
                self.config.iwidth = iwidth || self.config.iwidth;
                self.config.iheight = iheight || self.config.iheight;
                renderer.updateIframe(self.id, self.dom, self.config);
            });

            this.on('h_alignchange', function(alignh){
                self.config.alignh = alignh || self.config.alignh;
                renderer.updateIframe(self.id, self.dom, self.config);
                // self.scaleContents();
            });
            
            this.on('fullscreenchange', function(value){
                self.config.fullscreen = value ? true : false;
                renderer.updateIframe(self.id, self.dom, self.config);
            });


            const receive = (type, data) => {

                console.log("receive", type, data);
                // console.log(1);
                
                const scoringResultReturn = (data) => {

                    if(!data || !data["result"])
                        return;

                    console.log("getScoringResultReturn", data);
                    let results = data["result"];

                    // let tmp = Object.keys(data["params"][1]["incidents"])[0];
                    // let identifier = tmp.substring(tmp.indexOf("/item")+1).replace("/",".").replace("task=","").replace("item=","");

                    
                    /*  
                    *   for valid indentifier characters, check:
                    *   \vendor\qtism\qtism\qtism\common\utils\data\CharacterMap.php        
                    *   \vendor\qtism\qtism\qtism\runtime\pci\json\Unmarshaller.php
                    */

                    let classes = [];
                    let hits = [];
                    
                    for (let i of Object.keys(results)) {
                        if (i.indexOf("hit.") >= 0 && results[i] == true)
                            hits.push(i.split(".")[1]);
                    }

                    for (let i of Object.keys(results)) {
                        if (i.indexOf("hitClass.") >= 0) {
                            let hit = hits.indexOf(i.split(".")[1]);
                            if (hit >= 0){
                                let text = "";
                                if(typeof results["hitText."+hits[hit]] == "string")
                                    text = results["hitText."+hits[hit]];
                                classes.push({ "class": results[i], "hit": hits[hit], "text": text });
                                this.response.set(results[i] + ".hit", hits[hit]);
                                if(text.length>0)
                                    // this.response.set(identifier + "." + results[i] + ".hitText", text);
                                    this.response.set(results[i] + ".hitText", text);
                            }
                        }
                    }

                    this.responseRaw.push(results);
                }

                const endOfSequence = () => {
                    
                    if(this.config?.navigationLock){

						document.querySelectorAll("[data-control='next-section'], [data-control='move-end'], [data-control='move-forward'], [data-control='skip-end']")
						.forEach(e => e.classList.remove("hidden"));

						if($("[data-control='submit']").length)
							$("[data-control='submit']").trigger("click");

						if($("[data-control='move-end']").length)
							$("[data-control='move-end']").trigger("click");
						else if($("[data-control='move-forward']").length)
							$("[data-control='move-forward']").trigger("click");
						else if($("[data-control='next-section']").length)
							$("[data-control='next-section']").trigger("click");
					}
                }

                const callbacks = {
                    "endOfSequence": endOfSequence,
                    "getScoringResultReturn": scoringResultReturn,
                    "getTasksStateReturn": scoringResultReturn,
                    
                    "traceLogTransmission": (data) => {
                        if(!!data["traceLogData"]){
                            this.traceLogs.push(data["traceLogData"]);
                        }
                    }              
                };
    
                if (typeof callbacks[type] !== 'undefined') {
                    callbacks[type](data);
                }
            };
    
            // listen to messages from parent frame
            window.addEventListener('message', event => {
				if(typeof event?.data != "string")
					return;
                if(event.source !== this.iframe.contentWindow)
                    return;
                let data = JSON.parse(event.data);
                receive(data.eventType, data);
            }, false);
    };


    qtiCustomInteractionContext.register({
        getTypeIdentifier : function(){
            return 'heICnX';
        },        
        getInstance :  function(dom, config, state){
            let instance = new ibTaoConnector($(dom), config.properties);
            config.onready(instance);
                }
    });
});