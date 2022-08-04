export default class ARd20Token extends Token {
    #highlight;

    get isHighlighted() {
        return this.#highlight.visible;
    }

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
        const h = Math.round(t / 2);
        const o = Math.round(h / 2);
        this.#highlight.lineStyle(t, 0x000000, 0.8).drawRoundedRect(-o, -o, this.w + h, this.h + h, 3);
        this.#highlight.lineStyle(h, 0x00FF00, 1.0).drawRoundedRect(-o, -o, this.w + h, this.h + h, 3);
    }


    _onClickLeft(event) {
        if (game.settings.get('ard20', 'actionMouseRewrite')) {
            return this.setTarget(!this.isTargeted && this.isHighlighted, { releaseOthers: false });
        }
        super._onClickLeft(event);
    }

    setTarget(targeted = true, { user = null, releaseOthers = true, groupSelection = false } = {}) {
        if (game.settings.get('ard20', 'actionMouseRewrite') && !this.isHighlighted) {
            ui.notifications.warn(`нельзя выбрать токен "${this.name}", дебил, он не выделен`);
            return;
        }
        super.setTarget(targeted, { user: null, releaseOthers: true, groupSelection: false });
    }

    _onClickRight(event) {
        if (game.settings.get('ard20', 'actionMouseRewrite')) {
            return;
        }
        super._onClickRight(event);
    }


    _onClickLeft2(event) {
        if (game.settings.get('ard20', 'actionMouseRewrite')) {
            return;
        }
        super._onClickLeft2(event);
    }

    ;

    _onClickRight2(event) {
        if (game.settings.get('ard20', 'actionMouseRewrite')) {
            return;
        }
        super._onClickRight2(event);
    }

    showHighlight(visible) {
        this.#highlight.visible = visible;
    }

    _onWheel;
}
