export default class ARd20Token extends Token {
  #highlight;

  /** @override */
  async _draw() {
    await super._draw();
    this.#highlight = this.addChild(new PIXI.Graphics());
    this.#highlight.visible = false;
  }

  /** @override */
  _refresh() {
    super._refresh();
    const t = CONFIG.Canvas.objectBorderThickness;
    const h = Math.round(t/2);
    const o = Math.round(h/2);
    this.#highlight.lineStyle(t, 0x000000, 0.8).drawRoundedRect(-o, -o, this.w+h, this.h+h, 6);
    this.#highlight.lineStyle(h, 0x00FF00, 1.0).drawRoundedRect(-o, -o, this.w+h, this.h+h, 6);
  }

  showHighlight(visible) {
    this.#highlight.visible = visible;
  }
}
