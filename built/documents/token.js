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
        this.#highlight.clear();
        const t = CONFIG.Canvas.objectBorderThickness;
        const h = Math.round(t / 2);
        const o = Math.round(h / 2);
        this.#highlight.lineStyle(t, 0x000000, 0.8).drawEllipse(-o + this.w / 2, -o + this.h / 2, (this.w + 20 * h) / 2, (this.h + 20 * h) / 2);
        this.#highlight.lineStyle(h, 0x00FF00, 1.0).drawEllipse(-o + this.w / 2, -o + this.h / 2, (this.w + 20 * h) / 2, (this.h + 20 * h) / 2);
    }


    _onClickLeft(event) {
        if (game.settings.get('ard20', 'actionMouseRewrite')) {
            return this.setTarget(!this.isTargeted && this.isHighlighted, { releaseOthers: false, });
        }
        super._onClickLeft(event);
    }

    setTarget(targeted = true, { user = null, releaseOthers = true, groupSelection = false } = {}) {
        if (game.settings.get('ard20', 'actionMouseRewrite')) {
            if (!this.isHighlighted) {
                ui.notifications.warn(`you can't target that token "${this.name}", it's not Highlighted`);
                return;
            }
            if (targeted) {
                const max = game.user.getFlag('ard20', 'targetNumber');
                const targetNumber = game.user.targets.size;
                if (targetNumber >= max && max !== null) {
                    console.log(targetNumber, ' more than ', max);
                    ui.notifications.warn(`You can target only ${max} number of tokens`);
                    return;
                }
            }
        }
        super.setTarget(targeted, { user, releaseOthers, groupSelection });
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
