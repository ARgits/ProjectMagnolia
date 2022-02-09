/**
 * A type of Roll specific to a damage (or healing) roll in the 5e system.
 * @param {string} formula                       The string formula to parse
 * @param {object} data                          The data object against which to parse attributes within the formula
 * @param {object} [options={}]                  Extra optional arguments which describe or modify the DamageRoll
 * @param {number} [options.criticalBonusDice=0]      A number of bonus damage dice that are added for critical hits
 * @param {number} [options.criticalMultiplier=2]     A critical hit multiplier which is applied to critical hits
 * @param {boolean} [options.multiplyNumeric=false]   Multiply numeric terms by the critical multiplier
 * @param {boolean} [options.powerfulCritical=false]  Apply the "powerful criticals" house rule to critical hits
 *
 */
//@ts-expect-error
export default class DamageRoll extends Roll {
    //@ts-expect-error
    constructor(formula, data, options) {
        super(formula, data, options);
        // For backwards compatibility, skip rolls which do not have the "critical" option defined
        //@ts-expect-error
        if (this.options.critical !== undefined)
            this.configureDamage();
    }
    /* -------------------------------------------- */
    /**
     * A convenience reference for whether this DamageRoll is a critical hit
     * @type {boolean}
     */
    get isCritical() {
        //@ts-expect-error
        return this.options.critical;
    }
    /* -------------------------------------------- */
    /*  Damage Roll Methods                         */
    /* -------------------------------------------- */
    /**
     * Apply optional modifiers which customize the behavior of the d20term
     * @private
     */
    configureDamage() {
        let critBonus = 0;
        for (let [i, term] of this.terms.entries()) {
            if (!(term instanceof OperatorTerm)) {
                //@ts-expect-error
                term.options.damageType = i !== 0 && this.terms[i - 1] instanceof OperatorTerm ? this.options.damageType[i - 1] : this.options.damageType[i];
            }
            // Multiply dice terms
            if (term instanceof DiceTerm) {
                //@ts-expect-error
                term.options.baseNumber = term.options.baseNumber ?? term.number; // Reset back
                //@ts-expect-error
                term.number = term.options.baseNumber;
                if (this.isCritical) {
                    critBonus += term.number * term.faces;
                    let [oper, num] = [new OperatorTerm({ operator: "+" }), new NumericTerm({ number: critBonus, options: { flavor: "Crit" } })];
                    this.terms.splice(1, 0, oper);
                    this.terms.splice(2, 0, num);
                    //@ts-expect-error
                    let cb = this.options.criticalBonusDice && i === 0 ? this.options.criticalBonusDice : 0;
                    term.alter(1, cb);
                    //@ts-expect-error
                    term.options.critical = true;
                }
            }
            // Multiply numeric terms
            //@ts-expect-error
            else if (this.options.multiplyNumeric && term instanceof NumericTerm) {
                //@ts-expect-error
                term.options.baseNumber = term.options.baseNumber ?? term.number; // Reset back
                //@ts-expect-error
                term.number = term.options.baseNumber;
                if (this.isCritical) {
                    //@ts-expect-error
                    term.number *= this.options.criticalMultiplier ?? 2;
                    //@ts-expect-error
                    term.options.critical = true;
                }
            }
        }
        //@ts-expect-error
        this._formula = this.constructor.getFormula(this.terms);
    }
    /* -------------------------------------------- */
    /** @inheritdoc */
    toMessage(messageData = {}, options = {}) {
        //@ts-expect-error
        messageData.flavor = messageData.flavor || this.options.flavor;
        if (this.isCritical) {
            const label = game.i18n.localize("ARd20.CriticalHit");
            //@ts-expect-error
            messageData.flavor = messageData.flavor ? `${messageData.flavor} (${label})` : label;
        }
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
     * @param {string} [data.defaultCritical]     Should critical be selected as default
     * @param {string} [data.template]            A custom path to an HTML template to use instead of the default
     * @param {boolean} [data.allowCritical=true] Allow critical hit to be chosen as a possible damage mode
     * @param {object} options                  Additional Dialog customization options
     * @returns {Promise<D20Roll|null>}         A resulting D20Roll object constructed with the dialog, or null if the dialog was closed
     */
    //@ts-expect-error
    async configureDialog({ title, defaultRollMode, canMult, damType, mRoll, defaultCritical = false, template, allowCritical = true } = {}, options = {}) {
        // Render the Dialog inner HTML
        //@ts-expect-error
        const content = await renderTemplate(template ?? this.constructor.EVALUATION_TEMPLATE, {
            formula: `${this.formula} + @bonus`,
            defaultRollMode,
            rollModes: CONFIG.Dice.rollModes,
            canMult,
            damType,
            mRoll
        });
        // Create the Dialog window and await submission of the form
        return new Promise((resolve) => {
            new Dialog({
                title,
                content,
                buttons: {
                    critical: {
                        //@ts-expect-error
                        condition: allowCritical,
                        label: game.i18n.localize("ARd20.CriticalHit"),
                        callback: (html) => resolve(this._onDialogSubmit(html, true)),
                    },
                    normal: {
                        label: game.i18n.localize(allowCritical ? "ARd20.Normal" : "ARd20.Roll"),
                        callback: (html) => resolve(this._onDialogSubmit(html, false)),
                    },
                },
                default: defaultCritical ? "critical" : "normal",
                close: () => resolve(null),
            }, options).render(true);
        });
    }
    /* -------------------------------------------- */
    /**
     * Handle submission of the Roll evaluation configuration Dialog
     * @param {jQuery} html             The submitted dialog content
     * @param {boolean} isCritical      Is the damage a critical hit?
     * @private
     */
    //@ts-expect-error
    _onDialogSubmit(html, isCritical) {
        const form = html[0].querySelector("form");
        // Append a situational bonus term
        if (form.bonus.value) {
            const bonus = new Roll(form.bonus.value, this.data);
            if (!(bonus.terms[0] instanceof OperatorTerm))
                this.terms.push(new OperatorTerm({ operator: "+" }));
            this.terms = this.terms.concat(bonus.terms);
        }
        // Apply advantage or disadvantage
        //@ts-expect-error
        this.options.critical = isCritical;
        //@ts-expect-error
        this.options.rollMode = form.rollMode.value;
        //@ts-expect-error
        this.options.damageType.forEach((part, ind) => (this.options.damageType[ind] = form[`damageType.${ind}`] ? part[form[`damageType.${ind}`].value] : part[0]));
        //@ts-expect-error
        this.options.mRoll = form.mRoll?.checked;
        this.configureDamage();
        return this;
    }
    /* -------------------------------------------- */
    /** @inheritdoc */
    //@ts-expect-error
    static fromData(data) {
        const roll = super.fromData(data);
        //@ts-expect-error
        roll._formula = this.getFormula(roll.terms);
        return roll;
    }
}
/**
 * The HTML template path used to configure evaluation of this Roll
 * @type {string}
 */
DamageRoll.EVALUATION_TEMPLATE = "systems/ard20/templates/chat/roll-dialog.html";
