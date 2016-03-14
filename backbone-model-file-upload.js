//     Backbone.Model File Upload v1.0.0
//     by Joe Vu - joe.vu@homeslicesolutions.com
//     For all details and documentation:
//     https://github.com/homeslicesolutions/backbone-model-file-upload
//     Contributors:
//       lutherism - Alex Jansen - alex.openrobot.net
//       bildja - Dima Bildin - github.com/bildja
//       Minjung - Alejandro - github.com/Minjung
//       XemsDoom - Luca Moser - https://github.com/XemsDoom
//       DanilloCorvalan  - Danillo Corvalan - https://github.com/DanilloCorvalan

define([
    'require',
    'backbone',
    'underscore'], function(require, Backbone, _) {
    'use strict';

    // Clone the original Backbone.Model.prototype as superClass
    var _superClass = _.clone( Backbone.Model.prototype );

    // Extending out
    var BackboneModelFileUpload = {

        // ! Default file attribute - can be overwritten
        fileAttribute: 'file',

        // @ Save - overwritten
        save: function(key, val, options) {

            // Variables
            var attrs, attributes = this.attributes,
                that = this;

            // Signature parsing - taken directly from original Backbone.Model.save
            // and it states: 'Handle both "key", value and {key: value} -style arguments.'
            if (key == null || typeof key === 'object') {
                attrs = key;
                options = val;
            } else {
                (attrs = {})[key] = val;
            }

            // Validate & wait options - taken directly from original Backbone.Model.save
            options = _.extend({validate: true}, options);
            if (attrs && !options.wait) {
                if (!this.set(attrs, options)) return false;
            } else {
                if (!this._validate(attrs, options)) return false;
            }

            // Merge data temporarily for formdata
            var mergedAttrs = _.extend({}, attributes, attrs);

            if (attrs && options.wait) {
                this.attributes = mergedAttrs;
            }

            // Check for "formData" flag and check for if file exist.
            if ( options.formData === true
                || options.formData !== false
                && mergedAttrs[ this.fileAttribute ]
                && mergedAttrs[ this.fileAttribute ] instanceof File
                || mergedAttrs[ this.fileAttribute ] instanceof FileList
                || mergedAttrs[ this.fileAttribute ] instanceof Blob ) {

                // Flatten Attributes reapplying File Object
                var formAttrs = _.clone( mergedAttrs ),
                    fileAttr = mergedAttrs[ this.fileAttribute ];
                formAttrs[ this.fileAttribute ] = fileAttr;

                // Converting Attributes to Form Data
                var formData = new FormData();
                _.each( formAttrs, function( value, key ){
                    if (value instanceof Backbone.Collection || value instanceof Backbone.PageableCollection) {
                        formData.append(key, _.pluck(value.toJSON(), 'id'));
                    }else if (value instanceof FileList || (key === that.fileAttribute && value instanceof Array)) {
                        _.each(value, function(file) {
                            formData.append( key, file );
                        });
                    } else {
                        formData.append( key, value );
                    }
                });

                // Set options for AJAX call
                options.data = formData;
                options.processData = false;
                options.contentType = false;

                // Handle "progress" events
                if (!options.xhr) {
                    options.xhr = function(){
                        var xhr = Backbone.$.ajaxSettings.xhr();
                        xhr.upload.addEventListener('progress', _.bind(that._progressHandler, that), false);
                        return xhr
                    }
                }
            }

            // Resume back to original state
            if (attrs && options.wait) this.attributes = attributes;

            // Continue to call the existing "save" method
            return _superClass.save.call(this, attrs, options);

        },
        // _ Get the Progress of the uploading file
        _progressHandler: function( event ) {
            if (event.lengthComputable) {
                var percentComplete = event.loaded / event.total;
                this.trigger( 'progress', percentComplete );
            }
        }
    };

    return BackboneModelFileUpload;
});