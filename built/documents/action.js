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
    this.sheet = new ActionSheet(this);
    this.setParent(options?.parent);
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
      actor: actor ?? null,
      item: item ?? null,
      action: action ?? null,
    };
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
    console.log("Phase: validatig targets");
  }
  async roll() {
    console.log("Phase: rolling");
    if (!this.isRoll) return;
    let bonus = this.bonus;
    let formula = this.formula;
    let roll = new Roll(this.formula);
    await roll.evaluate();
    await roll.toMessage({ speaker: { alias: `${this.parent.parent.name}: ${this.parent.name} (${this.name})` } });
  }
}
