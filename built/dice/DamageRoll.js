export default class ARd20DamageRoll extends Roll {
    constructor(formula, data, options) {
        super(formula, data, options);
        console.log(formula, data, options);
        this.configureDamage();
    }

    configureDamage() {
        console.log(this, this.terms);
    }
}