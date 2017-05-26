/**
 * @class Oskari.mapframework.bundle.mappublished.LogoPlugin
 * Displays the NLS logo and provides a link to terms of use on top of the map.
 * Gets base urls from localization files.
 */
Oskari.clazz.define(
    'Oskari.mapframework.bundle.mapmodule.plugin.LogoPlugin',
    /**
     * @static @method create called automatically on construction
     *
     */
    function (config) {
        this._clazz =
            'Oskari.mapframework.bundle.mapmodule.plugin.LogoPlugin';
        this._defaultLocation = 'bottom left';
        this._index = 1;
        this._name = 'LogoPlugin';
    }, {
        constLayerGroupId : 'layers',
        templates: {
            main :  jQuery(
                '<div class="mapplugin logoplugin"></div>'
            ),
            dataSourcesDialog: jQuery('<div class="data-sources-dialog"></div>'),
            dataSourceGroup: jQuery('<div class="data-sources-group"><h4 class="data-sources-heading"></h4></div>'),
            extend: jQuery('<div style="display: inline-block; margin: 5px"><a href="#"></a></div>')
        },
        _initImpl : function() {
            this._loc = Oskari.getLocalization('MapModule', Oskari.getLang() || Oskari.getDefaultLanguage()).plugin.LogoPlugin;
        },
        getService : function() {
            if(!this._service) {
                this._service = Oskari.clazz.create('Oskari.map.DataProviderInfoService', this.getSandbox());

                if(this._service) {
                    var me = this;
                    // init group for layers
                    this._service.addGroup(me.constLayerGroupId, me._loc.layersHeader);
                    var layers = me.getSandbox().findAllSelectedMapLayers();
                    // add initial layers
                    layers.forEach(function(layer) {
                        me._service.addItemToGroup(me.constLayerGroupId, {
                            'id' : layer.getId(),
                            'name' : layer.getName(),
                            // AH-2182 Show source for user layers
                            'source' : layer.getSource && layer.getSource() ? layer.getSource() : layer.getOrganizationName()
                        });
                    });
                    // if service was created, add a change listener
                    this._service.on('change', function() {
                        me.updateDialog();
                    });
                }
            }
            return this._service;
        },
        createExtendService: function(el) {
          var me = this;
          var element = el || this.getElement();
          if(!this._extendService) {
              this._extendService = Oskari.clazz.create('Oskari.map.LogoPluginService', this.getSandbox());
          }
          this._extendService.on('change', function() {
              me.updateExtended(element);
          });
        },
        /**
         * @method _createEventHandlers
         * Create eventhandlers.
         *
         *
         * @return {Object.<string, Function>} EventHandlers
         */
        _createEventHandlers: function () {
            //TODO: listen to MapLayerEvent and if(event.getOperation() === 'update') -> update layer name in ui?
            return {
                'AfterMapLayerRemoveEvent' : function(event) {
                    var service = this.getService();
                    if(!service || !event.getMapLayer()) {
                        return;
                    }
                    service.removeItemFromGroup(this.constLayerGroupId, event.getMapLayer().getId());
                },
                'AfterMapLayerAddEvent' : function(event) {
                    var layer = event.getMapLayer();
                    var service = this.getService();
                    if(!service || !layer) {
                        return;
                    }
                    service.addItemToGroup(this.constLayerGroupId, {
                        'id' : layer.getId(),
                        'name' : layer.getName(),
                        // AH-2182 Show source for user layers
                        'source' : layer.getSource && layer.getSource() ? layer.getSource() : layer.getOrganizationName()
                    });
                },
                'MapSizeChangedEvent': function (event) {
                    if (this.dataSourcesDialog) {
                        var target = this.getElement().find('.data-sources');
                        if (target) {
                            this.dataSourcesDialog.moveTo(target, 'top');
                        }
                    }
                }

            };
        },

        /**
         * @method _setLayerToolsEditModeImpl
         * Called after layerToolsEditMode is set.
         *
         *
         */
        _setLayerToolsEditModeImpl: function () {
            var me = this;
            // TODO document why this is done...
            if (!me.inLayerToolsEditMode()) {
                me.setLocation(
                    me.getElement().parents('.mapplugins').attr(
                        'data-location'
                    )
                );
            } else if (me.dataSourcesDialog) {
                me.dataSourcesDialog.close(true);
                me.dataSourcesDialog = null;
            }
        },

        /**
         * @private @method _createControlElement
         * Draws the panbuttons on the screen.
         *
         *
         * @return {jQuery}
         * Plugin jQuery element
         */
        _createControlElement: function () {
            var container = this.templates.main.clone();
            var conf = this.getConfig() || {};
            this.createExtendService(container);
            this.changeFont(conf.font || this.getToolFontFromMapModule(), container);
            this._createServiceLink(container);

            var termsUrl = this.getSandbox().getLocalizedProperty(conf.termsUrl);
            this._createTermsLink(termsUrl, container);
            this._createDataSourcesLink(container);
            this._extendService.trigger("change");
            return container;
        },

        _createServiceLink: function (el) {
            var me = this,
                el = el || me.getElement(),
                mapUrl = me.__getMapUrl(),
                link,
                linkParams;
            if(!el) {
                return;
            }

            var options = {
              id:'icon',
              callback: function (event) {
                  if (!me.inLayerToolsEditMode()) {
                      linkParams = me.getSandbox().generateMapLinkParameters({});
                      window.open(mapUrl + linkParams, '_blank');
                  }
              }
            };

            me._extendService.addLabel('', options);
        },

        /**
         * Returns the map url for link tool
         * @private
         * @return {String} base URL for state parameters
         */
        __getMapUrl : function() {
            var sandbox = this.getSandbox();
            var url = sandbox.getLocalizedProperty(this.getConfig().mapUrlPrefix);

            // setup current url as base if none configured
            return sandbox.createURL(url || window.location.pathname, true);
        },
        _createTermsLink: function (termsUrl, el) {
            var me = this,
                el = el || me.getElement();
            if(!el) {
                return;
            }
            if(termsUrl) {
              var options = {
                id:'terms',
                callback: function (evt) {
                    evt.preventDefault();
                    if (!me.inLayerToolsEditMode()) {
                        window.open(termsUrl, '_blank');
                    }
                }
              };

              me._extendService.addLabel(me._loc.terms, options);
            } else {
              return;
            }
        },

        _createDataSourcesLink: function (el) {
            var me = this,
                conf = me.getConfig() || {},
                el = el || me.getElement();

            if(!el || conf.hideDataSourceLink) {
              return;
            }
            var options = {
              id:'data-sources',
              callback: function(e) {
                if (!me.inLayerToolsEditMode() && !me.dataSourcesDialog) {
                  me._openDataSourcesDialog(e.target);
                } else if (me.dataSourcesDialog) {
                  me.dataSourcesDialog.close(true);
                  me.dataSourcesDialog = null;
                }
              }
            };

            me._extendService.addLabel(me._loc.dataSources, options);
        },

        /**
         * @public @method changeFont
         * Changes the font plugin's font by adding a class to its DOM elements.
         *
         * @param {String} fontId
         * @param {jQuery} div
         *
         */
        changeFont: function (fontId, div) {
            var classToAdd,
                testRegex;

            div = div || this.getElement();

            if (!div || !fontId) {
                return;
            }

            classToAdd = 'oskari-publisher-font-' + fontId;
            testRegex = /oskari-publisher-font-/;

            this.changeCssClasses(classToAdd, testRegex, [div]);
        },

        updateDialog : function() {
            if(!this.dataSourcesDialog) {
                return;
            }
            this.dataSourcesDialog.setContent(this.getDialogContent());
            this.dataSourcesDialog.moveTo(this.getElement().find('div.data-sources'), 'top');
        },

        getDialogContent : function() {
            var service = this.getService();
            if(!service) {
                return;
            }
            var me = this;
            var content = this.templates.dataSourcesDialog.clone();
            var groups = this._service.getNonEmptyGroups();
            groups.forEach(function(group) {
                var tpl = me.templates.dataSourceGroup.clone();
                tpl.addClass(group.id);
                tpl.find('h4').html(group.name);
                group.items.forEach(function(item) {
                    var itemTpl = jQuery('<div></div>');
                    itemTpl.append(item.name);
                    itemTpl.append(me.__formatItemSources(item.source));
                    tpl.append(itemTpl);
                });
                content.append(tpl);
            });
            return content;
        },
        /**
         * The parameter can be undefined, string, object with url and name keys or array of such objects.
         * @param  {String|Object|Object[]} src datasources for item to show on the UI
         * @return {String|jQuery} appendable presentation of datasources for an UI item.
         */
        __formatItemSources : function(src) {
            if(!src) {
                return '';
            }
            var SEPARATOR = ' - ';
            var formatSrc = function(item) {
                if(typeof item ==='string') {
                    return item;
                }
                if(!item.url) {
                    return item.name;
                }
                var link = jQuery('<a target="_blank"></a>');
                link.attr('href', item.url);
                link.append(item.name);
                return link;
            }
            var tpl = jQuery('<span></span>');
            if(typeof src.forEach !== 'function') {
                tpl.append(SEPARATOR);
                tpl.append(formatSrc(src));
                return tpl;
            }

            src.forEach(function(item) {
                tpl.append(SEPARATOR);
                tpl.append(formatSrc(item));
            })
            return tpl;
        },
        /**
         * @method _openDataSourcesDialog
         * Opens a dialog to show data sources of the selected layers
         * and statistics indicators.
         *
         * @param  {jQuery} target arget element where the popup is attached to
         * @param  {Array[Object]} indicators the open indicators
         *
         * @return {undefined}
         */
        _openDataSourcesDialog: function (target) {
            var me = this;
            var popupTitle = me._loc.dataSources;
            var dialog = Oskari.clazz.create('Oskari.userinterface.component.Popup');
            me.dataSourcesDialog= dialog;

            var closeButton = Oskari.clazz.create('Oskari.userinterface.component.buttons.OkButton');
            closeButton.setHandler(function () {
                me.dataSourcesDialog = null;
                dialog.close(true);
            });
            var content = this.getDialogContent();
            dialog.show(popupTitle, content, [closeButton]);

            target = target || me.getElement().find('div.data-sources');
            dialog.moveTo(target, 'top');
        },

        /**
         * @method _addIndicatorsToDataSourcesDialog
         * Adds indicators to the data sources dialog.
         *
         * @param {Object} indicators
         *
         */
        _addIndicatorsToDataSourcesDialog: function (indicators) {
            if (!this.dataSourcesDialog) {
                return;
            }
            var me = this;
            this._service.removeGroup('indicators');
            this._service.addGroup('indicators', me._loc.indicatorsHeader);
            // add initial layers
            Object.keys(indicators).forEach(function(id) {
                me._service.addItemToGroup('indicators', {
                    'id' : id,
                    'name' : indicators[id].title,
                    'source' : indicators[id].organization
                });
            });
        },
        /**
         * @method addContentFromService
         * Adds functionality to plugin
         *
         * @param {Object} content
         *
         */
        updateExtended: function (el) {
          var me = this;
          if(!el && !this.getElement()) {
            return;
          }
          var template = el;
          var labels = this._extendService.getLabels();

          labels.forEach( function( link ) {
            var extend = me.templates.extend.clone();
            extend.addClass(link.options.id.toLowerCase());
            extend.find('a').text(link.title);
            template.append(extend);
            extend.on("click", function(e) {
              var result = link.options.callback(e);
            });
          });
        }
    }, {
        extend: ['Oskari.mapping.mapmodule.plugin.BasicMapModulePlugin'],
        /**
         * @static @property {string[]} protocol array of superclasses
         */
        protocol: [
            'Oskari.mapframework.module.Module',
            'Oskari.mapframework.ui.module.common.mapmodule.Plugin'
        ]
    }
);
