/**
 * A type of Roll specific to a d20-based check, save, or attack roll in the 5e system.
 * @param {string} formula                       The string formula to parse
 * @param {object} data                          The data object against which to parse attributes within the formula
 * @param {object} [options={}]                  Extra optional arguments which describe or modify the D20Roll
 * @param {number} [options.advantageMode]             What advantage modifier to apply to the roll (none, advantage, disadvantage)
 * @param {number} [options.critical]                  The value of d20 result which represents a critical success
 * @param {number} [options.fumble]                    The value of d20 result which represents a critical failure
 * @param {(number)} [options.targetValue]             Assign a target value against which the result of this roll should be compared
 * @param {boolean} [options.elvenAccuracy=false]      Allow Elven Accuracy to modify this roll?
 * @param {boolean} [options.halflingLucky=false]      Allow Halfling Luck to modify this roll?
 * @param {boolean} [options.reliableTalent=false]     Allow Reliable Talent to modify this roll?
 */
export default class D20Roll extends Roll {
    constructor(formula, data, options = {}) {
        super(formula, data, options);
        if (!(this.terms[0] instanceof Die && this.terms[0].faces === 20)) {
            throw new Error(`Invalid D20Roll formula provided ${this._formula}`);
        }
        this.configureModifiers();
    }
    /* -------------------------------------------- */
    /**
     * A convenience reference for whether this D20Roll has advantage
     * @type {boolean}
     */
    get hasAdvantage() {
        //@ts-expect-error
        return this.options.advantageMode === D20Roll.ADV_MODE.ADVANTAGE;
    }
    /**
     * A convenience reference for whether this D20Roll has disadvantage
     * @type {boolean}
     */
    get hasDisadvantage() {
        //@ts-expect-error
        return this.options.advantageMode === D20Roll.ADV_MODE.DISADVANTAGE;
    }
    /* -------------------------------------------- */
    /*  D20 Roll Methods                            */
    /* -------------------------------------------- */
    /**
     * Apply optional modifiers which customize the behavior of the d20term
     * @private
     */
    configureModifiers() {
        const d20 = this.terms[0];
        //@ts-expect-error
        d20.modifiers = [];
        // Handle Advantage or Disadvantage
        if (this.hasAdvantage) {
            //@ts-expect-error
            d20.number = 2;
            //@ts-expect-error
            d20.modifiers.push("kh");
            //@ts-expect-error
            d20.options.advantage = true;
        }
        else if (this.hasDisadvantage) {
            //@ts-expect-error
            d20.number = 2;
            //@ts-expect-error
            d20.modifiers.push("kl");
            //@ts-expect-error
            d20.options.disadvantage = true;
            //@ts-expect-error
        }
        else
            d20.number = 1;
        // Assign critical and fumble thresholds
        //@ts-expect-error
        if (this.options.critical)
            d20.options.critical = this.options.critical;
        //@ts-expect-error
        if (this.options.fumble)
            d20.options.fumble = this.options.fumble;
        //@ts-expect-error
        if (this.options.targetValue)
            d20.options.target = this.options.targetValue;
        // Re-compile the underlying formula
        //@ts-expect-error
        this._formula = this.constructor.getFormula(this.terms);
    }
    /* -------------------------------------------- */
    /** @inheritdoc */
    async toMessage(messageData = {}, options = {}) {
        // Evaluate the roll now so we have the results available to determine whether reliable talent came into play
        if (!this._evaluated)
            await this.evaluate({ async: true });
        // Add appropriate advantage mode message flavor and ard20 roll flags
        //@ts-expect-error
        messageData.flavor = messageData.flavor || this.options.flavor;
        //@ts-expect-error
        if (this.hasAdvantage)
            messageData.flavor += ` (${game.i18n.localize("ARd20.Advantage")})`;
        //@ts-expect-error
        else if (this.hasDisadvantage)
            messageData.flavor += ` (${game.i18n.localize("ARd20.Disadvantage")})`;
        // Record the preferred rollMode
        //@ts-expect-error
        options.rollMode = options.rollMode ?? this.options.rollMode;
        return super.toMessage(messageData, options);
    }
    /* -------------------------------------------- */
    /*  Configuration Dialog                        */
    /* -------------------------------------------- */
    /**
     * Create a Dialog prompt used to configure evaluation of an existing D20Roll instance.
     * @param {object} data                     Dialog configuration data
     * @param {string} [data.title]               The title of the shown dialog window
     * @param {number} [data.defaultRollMode]     The roll mode that the roll mode select element should default to
     * @param {number} [data.defaultAction]       The button marked as default
     * @param {boolean} [data.chooseModifier]     Choose which ability modifier should be applied to the roll?
     * @param {string} [data.defaultAbility]      For tool rolls, the default ability modifier applied to the roll
     * @param {string} [data.template]            A custom path to an HTML template to use instead of the default
     * @param {object} options                  Additional Dialog customization options
     * @returns {Promise<D20Roll|null>}         A resulting D20Roll object constructed with the dialog, or null if the dialog was closed
     */
    //@ts-expect-error
    async configureDialog({ title, defaultRollMode, canMult, defaultAction = D20Roll.ADV_MODE.NORMAL, mRoll, chooseModifier = false, defaultAttribute, template } = {}, options = {}) {
        // Render the Dialog inner HTML
        //@ts-expect-error
        const content = await renderTemplate(template ?? this.constructor.EVALUATION_TEMPLATE, {
            formula: `${this.formula} + @bonus`,
            //@ts-expect-error
            defaultRollMode,
            rollModes: CONFIG.Dice.rollModes,
            chooseModifier,
            defaultAttribute,
            attributes: CONFIG.ARd20.Attributes,
            //@ts-expect-error
            canMult,
            mRoll,
        });
        let defaultButton = "normal";
        switch (defaultAction) {
            case D20Roll.ADV_MODE.ADVANTAGE:
                defaultButton = "advantage";
                break;
            case D20Roll.ADV_MODE.DISADVANTAGE:
                defaultButton = "disadvantage";
                break;
        }
        // Create the Dialog window and await submission of the form
        return new Promise((resolve) => {
            new Dialog({
                //@ts-expect-error
                title,
                content,
                buttons: {
                    advantage: {
                        label: game.i18n.localize("ARd20.Advantage"),
                        callback: (html) => resolve(this._onDialogSubmit(html, D20Roll.ADV_MODE.ADVANTAGE)),
                    },
                    normal: {
                        label: game.i18n.localize("ARd20.Normal"),
                        callback: (html) => resolve(this._onDialogSubmit(html, D20Roll.ADV_MODE.NORMAL)),
                    },
                    disadvantage: {
                        label: game.i18n.localize("ARd20.Disadvantage"),
                        callback: (html) => resolve(this._onDialogSubmit(html, D20Roll.ADV_MODE.DISADVANTAGE)),
                    },
                },
                default: defaultButton,
                close: () => resolve(null),
            }, options).render(true);
        });
    }
    /* -------------------------------------------- */
    /**
     * Handle submission of the Roll evaluation configuration Dialog
     * @param {jQuery} html             The submitted dialog content
     * @param {number} advantageMode    The chosen advantage mode
     * @private
     */
    //@ts-expect-error
    _onDialogSubmit(html, advantageMode) {
        const form = html[0].querySelector("form");
        console.log(this);
        console.log(form, "ФОРМА");
        if (form.bonus.value) {
            const bonus = new Roll(form.bonus.value, this.data);
            if (!(bonus.terms[0] instanceof OperatorTerm))
                this.terms.push(new OperatorTerm({ operator: "+" }));
            this.terms = this.terms.concat(bonus.terms);
        }
        // Customize the modifier
        if (form.ability?.value) {
            //@ts-expect-error
            const abl = this.data.attributes[form.ability.value];
            console.log(abl);
            //@ts-expect-error
            this.terms.findSplice((t) => t.term === "@mod", new NumericTerm({ number: abl.mod }));
            //@ts-expect-error
            this.options.flavor += ` (${game.i18n.localize(CONFIG.ARd20.Attributes[form.ability.value])})`;
        }
        /* if (form.prof_type?.value) {
           const pr = this.data[form.prof_type.value][form.prof_value.value];
           console.log(pr);
           this.terms.findSplice((t) => t.term === "@prof_die", new Die({ number: 1, faces: pr.prof_die }));
           this.terms.findSplice((t) => t.term === "@prof_bonus", new NumericTerm({ number: pr.prof_bonus }));
         }*/
        // Apply advantage or disadvantage
        //@ts-expect-error
        this.options.advantageMode = advantageMode;
        //@ts-expect-error
        this.options.rollMode = form.rollMode.value;
        //@ts-expect-error
        this.options.mRoll = form.mRoll?.checked;
        this.configureModifiers();
        return this;
    }
}
/* -------------------------------------------- */
/**
 * Advantage mode of a 5e d20 roll
 * @enum {number}
 */
D20Roll.ADV_MODE = {
    NORMAL: 0,
    ADVANTAGE: 1,
    DISADVANTAGE: -1,
};
/**
 * The HTML template path used to configure evaluation of this Roll
 * @type {string}
 */
D20Roll.EVALUATION_TEMPLATE = "systems/ard20/templates/chat/roll-dialog.html";
