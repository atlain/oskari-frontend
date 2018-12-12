import olLayerVectorTile from 'ol/layer/VectorTile';
import {propsAsArray, WFS_ID_KEY} from './propertyArrayUtils';

export default class ReqEventHandler {
    constructor (sandbox) {
        this.sandbox = sandbox;
        this.isClickResponsive = true;
    }
    createEventHandlers (plugin) {
        const modifySelection = (layer, featureIds, keepPrevious) => {
            plugin.WFSLayerService.setWFSFeaturesSelections(layer.getId(), featureIds, !keepPrevious);
            this.notify('WFSFeaturesSelectedEvent', plugin.WFSLayerService.getSelectedFeatureIds(layer.getId()), layer, false);
        };
        const getSelectedLayer = (layerId) => this.sandbox.getMap().getSelectedLayer(layerId);

        return {
            'WFSFeaturesSelectedEvent': (event) => {
                plugin._updateLayerStyle(event.getMapLayer());
            },
            'MapClickedEvent': (event) => {
                if (!this.isClickResponsive) {
                    return;
                }
                const ftrAndLyr = plugin.getMap().forEachFeatureAtPixel([event.getMouseX(), event.getMouseY()], (feature, layer) => ({feature, layer}));
                if (!ftrAndLyr || !(ftrAndLyr.layer instanceof olLayerVectorTile)) {
                    return;
                }
                const layer = plugin.findLayerByOLLayer(ftrAndLyr.layer);
                if (!layer) {
                    return;
                }
                const keepPrevious = event.getParams().ctrlKeyDown;
                if (keepPrevious) {
                    modifySelection(layer, [ftrAndLyr.feature.get(WFS_ID_KEY)], keepPrevious);
                } else {
                    this.notify('GetInfoResultEvent', {
                        layerId: layer.getId(),
                        features: [propsAsArray(ftrAndLyr.feature.getProperties())],
                        lonlat: event.getLonLat()
                    });
                }
            },
            'AfterMapMoveEvent': () => {
                plugin.getAllLayerIds().forEach(layerId => {
                    const layer = getSelectedLayer(layerId);
                    plugin.updateLayerProperties(layer);
                });
            }
        };
    }
    notify (eventName, ...args) {
        var builder = Oskari.eventBuilder(eventName);
        if (!builder) {
            return;
        }
        this.sandbox.notifyAll(builder.apply(null, args));
    }
    createRequestHandlers (plugin) {
        return {
            'WfsLayerPlugin.ActivateHighlightRequest': this
        };
    }
    // handle WfsLayerPlugin.ActivateHighlightRequest
    handleRequest (oskariCore, request) {
        this.isClickResponsive = request.isEnabled();
    }
}
