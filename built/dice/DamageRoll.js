export default class ARd20DamageRoll extends Roll {
    constructor(formula, data, options) {
        super(formula, data, options);
        this.configureDamage(this.terms, this.options);
    }

    configureDamage(terms, options) {
        const { damageType } = options;
        console.log(damageType);
        for (let [index, term] of terms.entries()) {
            if (!(term instanceof OperatorTerm)) {
                term.options.damageType = index !== 0 && this.terms[index - 1] instanceof OperatorTerm ? damageType[index - 1] : damageType[index];
                if (term instanceof PoolTerm) {
                    let poolOptions = Array(term.rolls[0].terms.length).fill(term.options.damageType);
                    this.configureDamage(term.rolls[0].terms, { damageType: poolOptions });
                }
            }
        }
    }

    async setDataForSvelte() {
        const tooltip = this.dice.map(d => d);
        return {
            formula: this.formula,
            total: Math.round(this.total * 100) / 100,
            tooltip
        };
    }
}