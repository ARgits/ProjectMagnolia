import { uuidv4 } from "@typhonjs-fvtt/runtime/svelte/util";
import ActionSheet from "../sheets/svelte/action/actionSheet.js";
//TODO: https://svelte.dev/repl/788dff6fc20349f0a8ab500f8b2e8403?version=3.21.0 drag&drop
export default class ARd20Action {

    constructor(object = {}, options = {}) {
        this.name = object.name ?? "New Action";
        this.type = object.type ?? "Attack";
        this.formula = object?.formula ?? "2d10";
        this.bonus = object?.bonus ?? 0;
        this.dc = object?.dc ?? { type: "parameter", value: "reflex" };
        this.id = options?.keepId ? object?.id ?? uuidv4() : uuidv4();
        this.isRoll = object?.isRoll ?? true;
        this.setTargetLimit(object?.type);
        this.range = object?.range ?? { max: 5, min: 0 };
        this.setParent(options?.parent);
        this.sheet = new ActionSheet(this);
        this.template = object?.template ?? null;
        /*this.actionList = object?.actionList
          ? object.actionList.map((action) => {
              return new ARd20Action(action);
            })
          : [];*/
    }

    /**
     * Icon and text hint for action
     */
    setHint(object) {
        let icon = object?.icon ?? "";
        let text = object?.text ?? "";
        this.hint = { icon, text };
    }

    /**
     * How many characters can you target with that action
     */
    setTargetLimit(target) {
        let type = target?.type ?? "single";
        let number;
        switch (type) {
            case "single" || "self":
                number = 1;
                break;
            case "all":
                number = Infinity;
                break;
            case "custom":
                number = target?.number ?? 1;
                break;
        }
        this.targetLimit = { number, type };
    }

    setParent(object = {}) {
        const { actor, item, action } = object;
        this.parent = {
            actor: actor.uuid ?? null,
            item: item.uuid ?? null,
            action: action ?? null,
        };
    }

    async getActor() {
        if (!this.parent.actor) {
            return;
        }
        return await fromUuid(this.parent.actor);
    }

    async getItem() {
        if (!this.parent.item) {
            return;
        }
        return await fromUuid(this.parent.item);
    }

    /**
     * Use action
     * Workflow: TODO: maybe add way to configure steps
     * 1. Check Template - check if there is Measured Template
     * 1a. Place Template
     * 1b. If not template - check if token have targets
     * 2. Validate targets (if action has Measured Template and it affect all tokens in it - skip this step)
     * 2a. If there is no targets (and no template) - ask user to target tokens (highlight possible)
     * 2b. If user has targets before - check if you can use action on them (maybe highlight wrong or just throw an error)
     * 3.
     *
     */
    async use() {
        console.log("ACTION USE", this);
        const actor = await this.getActor();
        await actor._sheet.minimize();
        return this.placeTemplate();
    }

    placeTemplate() {
        console.log("Phase: placing template");
        if (!this.template) {
            return this.validateTargets();
        }
        /*TODO: look at 5e https://github.com/foundryvtt/dnd5e/blob/master/module/pixi/ability-template.js
        and then change handlers.mm and handlers.lc events, so it will tell you, that your template "out of the range"
        for measurement use canvas.grid.measureDistance
        */
        return this.roll();
    }

    async validateTargets() {
        const actorUuid = this.parent.actor;
        const user = game.user;
        //get token that use that action
        const activeToken = canvas.scene.tokens.filter((token) => {
            return token._object.controlled && token.actor.uuid === actorUuid;
        })[0];
        console.log("Phase: validating targets");
        if (!activeToken) {
            return;
        }
        this.checkTokens(activeToken, this);
        if (!canvas.tokens.active) {
            canvas.tokens.activate();
        }

        await game.settings.set('ard20', 'actionMouseRewrite', true);
        const releaseSetting = game.settings.get('core', 'leftClickRelease');
        if (releaseSetting) {
            await game.settings.set('core', 'leftClickRelease', false);
        }
        ui.notifications.info('Левый клик - выбор цели; Правый клик - Применение действия ко всем целям, либо отмена', { permanent: true });
        const handlers = {};
        handlers.leftClick = event => {
            event.stopPropagation();
        };
        handlers.rightClick = async () => {
            console.log('right click');
            canvas.stage.off('mousedown', handlers.leftClick);
            canvas.app.view.oncontextmenu = null;
            canvas.app.view.onwheel = null;
            await game.settings.set('core', 'leftClickRelease', releaseSetting);
            await game.settings.set('ard20', 'actionMouseRewrite', false);
            ui.notifications.active.filter((elem) => elem[0].classList.contains('permanent')).forEach((e) => e.remove());
            await this.roll(user);
        };
        handlers.scrollWheel = event => {
            if (event.ctrlKey || event.shiftKey) {
                const check = this.checkTokens;
                const action = Object.assign({}, this);
                setTimeout(check, 100, activeToken, action);
            }
        };

        canvas.stage.on('mousedown', handlers.leftClick);
        canvas.app.view.oncontextmenu = handlers.rightClick;
        canvas.app.view.onwheel = handlers.scrollWheel;

    }

    async roll(user) {
        const targets = user.targets;
        console.log("Phase: rolling");
        if (!this.isRoll) {
            return;
        }
        let bonus = this.bonus;
        let formula = this.formula;
        let roll = new Roll(this.formula);
        const actor = await this.getActor();
        const item = await this.getItem();
        for (const target of targets) {
            let tokenRoll;
            if (roll._evaluated) {
                tokenRoll = await roll.reroll();
            }
            else {
                tokenRoll = await roll.evaluate();
            }
            console.log(tokenRoll);
            ui.notifications.info(`Совершается бросок для цели "${target.name}"`);
            await tokenRoll.toMessage({ speaker: { alias: `${actor.name}: ${item.name} (${this.name}) vs ${target.name}` } });
        }
        return this.finishAction(user);

    }

    finishAction(user) {
        user.updateTokenTargets([]);
        canvas.scene.tokens.forEach(t => t.object.showHighlight(false));
    }

    checkTokens(activeToken, action) {
        const tokenUuid = activeToken.uuid;
        const activeTokenXY = { x: activeToken.x, y: activeToken.y };
        for (const token of canvas.scene.tokens) {
            if (token.uuid === tokenUuid) {
                continue;
            }
            const target = token.object;
            const targetXY = { x: token.x, y: token.y };
            const range = Math.round(canvas.grid.measureDistance(activeTokenXY, targetXY));
            const inRange = range <= action.range.max && range >= action.range.min;
            target.setTarget(target.isVisible && target.isTargeted, { releaseOthers: false });
            target.showHighlight(target.isVisible && inRange);

        }
    }
}
