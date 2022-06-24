
export class Action{
    constructor(object = {}){
        this.name = object.name ??"New Action"
        this.type = object.type ??"Attack"
        this.template = object.template
        this.attack = object.attack
        this.damage = object.damage
        this.hint = object.hint
        this.heal = object.heal
    }
    set template
}