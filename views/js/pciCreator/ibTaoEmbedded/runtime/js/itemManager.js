define([
    'json!ibTaoEmbedded/confDefault.json',
    'json!ibTaoEmbedded/confSchema.json',
    'ibTaoEmbedded/runtime/js/ajv.min',
    'lodash'
    ], 
    function(conf, schema, Ajv, _){

        'use strict';
        let ajv = new Ajv();
        var validate = ajv.compile(schema);
        if(!validate(conf)){
            throw new Error("ItebuilderIntegration: Config json file did not validate successfully.");
        }

        return {
            getConf : function(){
                return conf;
            }
        }
});