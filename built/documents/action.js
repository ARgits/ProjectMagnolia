import { uuidv4 } from "@typhonjs-fvtt/runtime/svelte/util";
//TODO: https://svelte.dev/repl/788dff6fc20349f0a8ab500f8b2e8403?version=3.21.0 drag&drop
export class Action {
  constructor(object = {}) {
    this.name = object.name ?? "New Action";
    this.type = object.type ?? "Attack";
    this.formula = object?.formula ?? "2d10";
    this.bonus = object?.bonus ?? 0;
    this.dc = object?.dc ?? { type: "parameter", value: "reflex" };
    this.id = uuidv4();
    this.isRoll = true;
    this.setTargetLimit(object);
    this.range = { max: 5, min: 0 };
    this.sheet = ActionSheet(this)
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
    let type = target.type ?? "single";
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
  use() {
    console.log('ACTION USE', this)
    this.placeTemplate();
  }
  placeTemplate() {
    console.log('Phase: placing template')
    if (!this.template) this.validateTargets();
    /*TODO: look at 5e https://github.com/foundryvtt/dnd5e/blob/master/module/pixi/ability-template.js
    and then change handlers.mm and handlers.lc events, so it will tell you, that your template "out of the range"
    for measrement use canvas.grid.measureDistance
    */
   this.validateTargets();
  }
  validateTargets() {
    console.log('Phase: validatig targets')
  }
}
let act = new Action();
console.log(act);
