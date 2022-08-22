export default class ARd20DamageRoll extends Roll {
    constructor(formula, data, options) {
        super(formula, data, options);
        this.configureDamage();
    }

    configureDamage() {
        const { damageType } = this.options;
        for (let [index, term] of this.terms.entries()) {
            if (!(term instanceof OperatorTerm)) {
                term.options.damageType = index !== 0 && this.terms[index - 1] instanceof OperatorTerm ? damageType[index - 1] : damageType[index];
            }
        }
    }
}