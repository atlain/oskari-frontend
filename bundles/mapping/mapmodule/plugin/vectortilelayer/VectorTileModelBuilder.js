
const Style = Oskari.clazz.get('Oskari.mapframework.domain.Style');

export default class VectorTileModelBuilder {
    parseLayerData(layer, mapLayerJson, maplayerService) {
        if (mapLayerJson.options.styles) {
            Object.keys(mapLayerJson.options.styles).forEach((styleName) => {
                const style = new Style();
                style.setName(styleName);
                style.setTitle(styleName);
                layer.addStyle(style);
            });
            layer.selectStyle('default');
        }
    }
}