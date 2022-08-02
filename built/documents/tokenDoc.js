export default class ARd20TokenDocument extends TokenDocument {
    get isTargeted() {
        return this.object.isTargeted;
    }
}