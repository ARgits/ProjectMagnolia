import { uuidv4 } from "@typhonjs-fvtt/runtime/svelte/util";
import ActionSheet from "../sheets/svelte/action/actionSheet.js";
//TODO: https://svelte.dev/repl/788dff6fc20349f0a8ab500f8b2e8403?version=3.21.0 drag&drop
export default class ARd20Action {

    constructor(object = {}, options = {}) {
        this.name = object?.name ?? "New Action";
        this.type = object?.type ?? "Attack";
        this.formula = object?.formula ?? "2d10";
        this.bonus = object?.bonus ?? 0;
        this.dc = object?.dc ?? { type: "parameter", value: "reflex" };
        this._id = options?.keepId ? object?._id ?? uuidv4() : uuidv4();
        this.isRoll = object?.isRoll ?? true;
        this.setTargetLimit(object?.target);
        this.range = object?.range ?? { max: 5, min: 0 };
        this.setParent(options?.parent);
        this.template = object?.template ?? null;
        this.useOnFail = this.parent.action ? object?.useOnFail ?? false : false;
        this.failFormula = this.useOnFail ? object?.failFormula ?? this.formula : this.formula;
        this.subActions = this.getSubActions(object);
        this.damage = object?.damage ?? [];
    }

    get documentName() {
        return 'Action';
    }

    get id() {
        return this._id;
    }

    get sheet() {
        return new ActionSheet(this);
    }

    get uuid() {
        let uuid = "";
        if (this.parent.action) {
            uuid += this.parent.action + ".";
        }
        else if (this.parent.item) {
            uuid += this.parent.item + ".";
        }
        else if (this.parent.actor) {
            uuid += this.parent.actor + ".";
        }
        uuid += `Action.${this.id}`;
        return uuid;
    }

    async removeSubAction() {
        const uuidIndex = this.uuid.split('.').findIndex(part => part === 'Action');
        const parts = this.uuid.split('.').slice(uuidIndex);
        const doc = await this.getItem() ?? await this.getActor();
        const action = doc.system.actionList.filter(act => act.id === parts[1])[0];
        parts.splice(0, 2);
        //get new array of Actions from its actual parent
        //TODO: case for world-scope actions
        return action._getSubAction(parts, true);
    }

    /** Get SubAction. If its part of remove function, returns new array of subActions
     * @param parts {string|[]} - SubAction's UUID or array of ids
     * @param remove {boolean} - delete this subAction or just return its value
     * @returns {ARd20Action|ARd20Action[]}*/
    _getSubAction(parts, remove) {
        if (typeof parts === "string") {
            const uuidIndex = parts.split('.').findIndex(part => part === 'Action');
            parts = parts.split('.').slice(uuidIndex);
            if (parts[1] === this.id) {
                parts.splice(0, 2);
            }
        }
        console.log(parts);
        if (parts.length > 2) {
            const action = this.subActions.filter(act => act.id === parts[1])[0];
            parts.splice(0, 2);
            return action._getSubAction(parts, remove);
        }
        else if (remove) {
            const index = this.subActions.findIndex(act => act.id === parts[1]);
            this.subActions.splice(index, 1);
            console.log(this.subActions);
            return this.subActions;
        }
        else {
            console.log(this.subActions.filter(act => act.id === parts[1])[0]);
            return this.subActions.filter(act => act.id === parts[1])[0];
        }
    }

    async addSubAction(object = {}, options = {}) {
        const actionList = this.subActions;
        const numberOfNewActions =
            actionList.filter((action) => {
                console.log(action.name.substring(0, 14) === "New sub-Action");
                return action.name.substring(0, 14) === "New sub-Action";
            }).length + 1;
        object.name = numberOfNewActions - 1 ? "New sub-Action" + "#" + numberOfNewActions : "New sub-Action";
        object.id = uuidv4();
        options = {
            parent: { actor: this.parent.actor, item: this.parent.item, action: this.uuid },
        };
        return [...actionList, new ARd20Action(object, options)];
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
    setTargetLimit(target = {}) {
        const { type, max, min } = target;
        this.target = {
            type: type ?? "single",
            max: type === "custom" ? Math.max(max, min) : null,
            min: type === "custom" ? Math.min(max, min) : null
        };
    }

    setParent(object = {}) {
        const { actor, item, action } = object;
        this.parent = {
            actor: actor ?? null,
            item: item ?? null,
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

    /**Prepare list of SubActions
     * @returns {ARd20Action[]}
     * */
    getSubActions(object) {
        const options = {
            parent: { actor: this.parent.actor, item: this.parent.item, action: this.uuid },
            keepId: true
        };
        return object?.subActions?.map(act => new ARd20Action(act, options)) ?? [];
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
        const doc = await this.getActor();
        //if this is synthetic actor, go little deeper
        const actor = doc.documentName === 'Actor' ? doc : doc.actor;
        console.log(actor);
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
        const tokenNumber = this.target.type === 'custom' ? this.target.max : this.target.type === 'single' ? 1 : Infinity;
        await user.setFlag('ard20', 'targetNumber', tokenNumber);
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
        ui.notifications.info('Left Click - target Token, Right Click - submit selection or cancel Action', { permanent: true });
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
            await this.roll(user, [...user.targets]);
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

    async roll(user, targets) {
        console.log("Phase: rolling ", "action: ", this.name);
        if (!this.isRoll) {
            return;
        }
        await this.commonRoll(targets);
        await this.attackRoll(targets);
        await this.damageRoll(targets);

    }

    async commonRoll(targets) {
        if (this.type !== 'Common') {
            return;
        }
        let bonus = this.bonus;
        let formula = this.formula;
        let roll = new Roll(formula);
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
            console.log(`Совершается бросок для цели "${target.name}"`);
            await tokenRoll.toMessage({ speaker: { alias: `${actor.name}: ${item.name} (${this.name}) vs ${target.name}` } });
        }
    }

    async attackRoll(targets) {
        if (this.type !== 'Attack') {
            return;
        }
        const roll = new Roll(this.formula);
        targets = targets.map(t => {
            return { target: t, hit: false };
        });
        for (const t of targets) {
            const actor = t.target.actor;
            const defence = actor.system.defences.stats.reflex.value;
            let tokenRoll;
            if (roll._evaluated) {
                tokenRoll = await roll.reroll();
            }
            else {
                tokenRoll = await roll.roll();
            }
            t.hit = tokenRoll.total >= defence;
            t.actor = actor;
            t.defence = t.defence ? [...t.defence, defence] : [defence];
            t.attack = t.attack ? [...t.attack, tokenRoll.total] : [tokenRoll.total];
        }
        console.log(targets);
        return await this.useSubActions(targets);
    }

    async damageRoll(targets) {
        if (this.type !== 'Damage') {
            return;
        }
        for (const t of targets) {
            if (this.useOnFail || t.hit) {
                let damRoll = t.hit ? new Roll(this.formula) : new Roll(this.failFormula);
                await damRoll.roll();
                console.log(damRoll, t.hit);
                t.damage = damRoll.total;
            }
        }
        console.log(targets);
        return await this.useSubActions(targets);
    }

    async useSubActions(targets) {
        if (targets.length > 0) {
            for (const action of this.subActions) {
                await action.roll(null, targets);
            }
        }
        if (!this.parent.action) {
            await this.finishAction(targets);
        }
    }

    async finishAction(targets) {
        const results = targets.map(t => {
            return {
                actor: t.target.actor,
                damage: t.damage,
                attack: t.attack,
                defence: t.defence,
                hit: t.hit ? 'hit' : 'miss'
            };
        });
        game.user.updateTokenTargets([]);
        await game.user.unsetFlag('ard20', 'targetNumber');
        canvas.scene.tokens.forEach(t => t.object.showHighlight(false));
        if (results.length > 0) {
            ChatMessage.create({ user: game.user.id, flags: { world: { svelte: { results } } } });
        }
    }

    checkTokens(activeToken, action) {
        const tokenUuid = activeToken.uuid;
        const activeTokenObj = activeToken.object;
        const bounds = activeTokenObj.bounds;
        /*
        * TL - TopLeft x,y
        * TR - TopRight x,y
        * BL - BottomLeft x,y
        * BR - BottomRight x,y
        */
        const points = {
            TL: { x: bounds.left, y: bounds.top },
            TR: { x: bounds.right, y: bounds.top },
            BL: { x: bounds.left, y: bounds.bottom },
            BR: { x: bounds.right, y: bounds.bottom }
        };

        for (const token of canvas.scene.tokens) {
            if (token.uuid === tokenUuid) {
                continue;
            }
            let pointName = "";
            const target = token.object;
            const targetPoints = {
                TL: { x: target.bounds.left, y: target.bounds.top },
                TR: { x: target.bounds.right, y: target.bounds.top },
                BL: { x: target.bounds.left, y: target.bounds.bottom },
                BR: { x: target.bounds.right, y: target.bounds.bottom }
            };
            pointName += activeToken.y - target.y >= 0 ? "T" : "B";
            pointName += activeToken.x - target.x >= 0 ? "R" : "L";
            const range = Object.entries(targetPoints).reduce((previousValue, currentValue) => {
                const currentRange = canvas.grid.measureDistance(currentValue[1], points[pointName]);
                if (currentRange < previousValue) {
                    return currentRange;
                }
                else {
                    return previousValue;
                }
            }, canvas.grid.measureDistance(targetPoints[pointName], points[pointName]));
            const inRange = range <= action.range.max && range >= action.range.min;
            target.setTarget(target.isVisible && target.isTargeted, { releaseOthers: false });
            target.showHighlight(target.isVisible && inRange);

        }
    }
}
