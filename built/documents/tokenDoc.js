export default class ARd20TokenDocument extends TokenDocument {
    get isTargeted() {
        return this.object.isTargeted;
    }

    _onUpdateBaseActor(update = {}, options = {}) {
        super._onUpdateBaseActor(update, options);
    }
}