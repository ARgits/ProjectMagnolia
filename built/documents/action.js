import { uuidv4 } from "@typhonjs-fvtt/runtime/svelte/util";
import ActionSheet from "../sheets/svelte/action/actionSheet.js";
//TODO: https://svelte.dev/repl/788dff6fc20349f0a8ab500f8b2e8403?version=3.21.0 drag&drop
export default class ARd20Action {
  constructor(object = {}, options = {}) {
    console.log("creating action");
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
    /*this.actionList = object?.actionList
      ? object.actionList.map((action) => {
          return new ARd20Action(action);
        })
      : [];*/
    console.log("Action created");
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
    if (!this.parent.actor) return;
    return await fromUuid(this.parent.actor);
  }
  async getItem() {
    if (!this.parent.item) return;
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
    this.placeTemplate();
    this.validateTargets();
    await this.roll();
  }
  placeTemplate() {
    console.log("Phase: placing template");
    if (!this.template) return;
    /*TODO: look at 5e https://github.com/foundryvtt/dnd5e/blob/master/module/pixi/ability-template.js
    and then change handlers.mm and handlers.lc events, so it will tell you, that your template "out of the range"
    for measrement use canvas.grid.measureDistance
    */
  }
  validateTargets() {
    const actorUuid = this.parent.actor;

    //get token that use that action
    const activeToken = game.scenes.current.tokens.filter((token) => {
      return token._object.controlled && token.actor.uuid === actorUuid;
    })[0];
    console.log("Phase: validatig targets");
    if (!activeToken) return;
    const activeTokenUuid = activeToken.uuid;
    const activeTokenVision = activeToken.object.vision;
    console.log("Active Token: ", activeToken);
    //get array of tokens on scene, without our token
    const tokens = game.scenes.current.tokens.filter((token) => {
      return token.uuid !== activeTokenUuid && activeTokenVision.fov.contains(token.x, token.y);
    });
    console.log(tokens);
    tokens.forEach((token) => {
      token.object.showHighlight(true);
    });
    const cancelHighlight = tokens.forEach((token) => {
      token.object.showHighlight(false);
    });
    console.log("Tokens that you see: ", tokens);
    setTimeout(cancelHighlight, 5000);
  }
  async roll() {
    console.log("Phase: rolling");
    if (!this.isRoll) return;
    let bonus = this.bonus;
    let formula = this.formula;
    let roll = new Roll(this.formula);
    const actor = await this.getActor();
    const item = await this.getItem();
    await roll.evaluate();
    await roll.toMessage({ speaker: { alias: `${actor.name}: ${item.name} (${this.name})` } });
  }
}
