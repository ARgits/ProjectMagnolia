export default class ARd20DamageRoll extends Roll {
    constructor(formula, data, options) {
        super(formula, data, options);
        this.configureDamage(this.terms, this.options);
    }

    configureDamage(terms, options) {
        const { damageType } = options;
        console.log(damageType);
        const filteredTerms = terms.filter(term => !(term instanceof OperatorTerm));
        for (let [index, term] of filteredTerms.entries()) {
            term.options.damageType = damageType[index];
            if (term instanceof PoolTerm) {
                let poolOptions = Array(term.rolls[0].terms.length).fill(term.options.damageType);
                this.configureDamage(term.rolls[0].terms, { damageType: poolOptions });

            }
        }
    }

    async setDataForSvelte() {
        const dice = this.dice.map(d => d);
        return {
            formula: this.formula,
            total: Math.round(this.total * 100) / 100,
            dice
        };
    }
}