/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ARd20Item extends Item {
    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData () {
        // As with the actor class, items are documents that can have their data
        // preparation methods overridden (such as prepareBaseData()).
        super.prepareData()
    }
    prepareBaseData () {}
    prepareDerivedData () {
        super.prepareDerivedData()
        const itemData = this.data
        const actorData = this.actor ? this.actor.data : {}
        const data = itemData.data
        const labels = ( this.labels = {} )
        if ( itemData.type === "spell" ) {
            labels.school = CONFIG.ARd20.SpellSchool[ data.school ]
        }
        if ( itemData.type === "weapon" ) {
            for ( let [ k, v ] of Object.entries( data.property.untrained ) ) {
                v = CONFIG.ARd20.Prop[ k ] ?? k
            }
            for ( let [ k, v ] of Object.entries( data.property.basic ) ) {
                v = CONFIG.ARd20.Prop[ k ] ?? k
                if ( data.property.untrained[ k ] === true && k != "awk" ) {
                    data.property.basic[ k ] = true
                }
            }
            for ( let [ k, v ] of Object.entries( data.property.master ) ) {
                v = CONFIG.ARd20.Prop[ k ] ?? k
                if ( data.property.basic[ k ] === true && k != "awk" ) {
                    data.property.master[ k ] = true
                }
            }
            for ( let [ k, v ] of Object.entries( CONFIG.ARd20.prof ) ) {
                v = game.i18n.localize( CONFIG.ARd20.prof[ k ] ) ?? k
                v = v.toLowerCase()
                data.deflect[ v ] = data.deflect[ v ] || data.damage.common[ v ]
            }
            data.type.value = data.type.value || "amb"
            labels.type =
                game.i18n.localize( CONFIG.ARd20.WeaponType[ data.type.value ] ) ??
                CONFIG.ARd20.WeaponType[ data.type.value ]
            labels.prof =
                game.i18n.localize( CONFIG.ARd20.prof[ data.prof.value ] ) ??
                CONFIG.ARd20.prof[ data.prof.value ]
            data.prof.label = labels.prof
            data.type.label = labels.type
        }
        if ( !this.isOwned ) this.prepareFinalAttributes()
    }
    prepareFinalAttributes () {
        const data = this.data.data
        const abil = ( data.abil = {} )
        const prof = data.prof.value
        let prof_bonus = 0
        if ( prof == 0 ) {
            prof_bonus = 0
        } else if ( prof == 1 ) {
            prof_bonus = this.actor.data.data.attributes.prof_die
        } else if ( prof == 2 ) {
            prof_bonus = this.actor.data.data.attributes.prof_die + "+" + this.actor.data.data.attributes.prof_bonus
        }
        for ( let [ k, v ] of Object.entries( CONFIG.ARd20.abilities ) ) {
            v = this.isOwned
                ? getProperty( this.actor.data, `data.abilities.${ k }.mod` )
                : null
            abil[ k ] = v
        }
        this.data.data.damage.common.current =
            this.data.data.damage.common[ this.labels.prof.toLowerCase() ] +
            "+" +
            abil.str
        this.data.data.attack = "1d20+" + prof_bonus + "+" + abil.dex
    }
    /**
     * Prepare a data object which is passed to any Roll formulas which are created related to this Item
     * @private
     */
    getRollData () {
        // If present, return the actor's roll data.
        if ( !this.actor ) return null
        const rollData = this.actor.getRollData()
        rollData.item = foundry.utils.deepClone( this.data.data )
        return rollData
    }
    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */

    async roll () {
        const item = this.data

        // Initialize chat data.
        const speaker = ChatMessage.getSpeaker( { actor: this.actor } )
        const rollMode = game.settings.get( "core", "rollMode" )
        const label = `[${ item.type }] ${ item.name }`

        // Otherwise, create a roll and send a chat message from it.
        if ( item.type === "weapon" ) {
            const rollData = this.getRollData()
            const targets = game.user.targets
            const ts = targets.size
            const attackRoll = new Roll( rollData.item.attack, rollData ).roll()
            attackRoll.toMessage( {
                speaker: speaker,
                rollMode: rollMode,
                flavor: label,
            } )
            const damageRoll = new Roll(
                rollData.item.damage.common.current,
                rollData
            ).roll()
            damageRoll.toMessage( {
                speaker: speaker,
                rollMode: rollMode,
                flavor: label,
            } )
            console.log( ts )
            if ( ts >= 1 ) {
                targets.forEach(async function(token){
                    if (game.user.isGM){
                        console.log('GM');
                        const actor = token.actor;
                        const actorData = actor.data.data;
                        const reflex = actorData.defences.reflex.value
                        if (attackRoll.total>=reflex){
                            console.log('HIT!');
                            console.log(actorData.health.value)
                            let {value} = actorData.health.value
                            let obj={}
                            value -=damageRoll.total;
                            obj['data.health.value']=value
                            await actor.update(obj)
                            console.log(actorData.health.value)
                        }else console.log("miss")
                    }else console.log('not GM')
                });
            } else if ( ts === 0 ) { console.log( 'нет целей' ) }
            const attack = [ attackRoll, damageRoll ]
            return attack
        }
        // If there's no roll data, send a chat message.
        else if ( !this.data.data.formula ) {
            ChatMessage.create( {
                speaker: speaker,
                rollMode: rollMode,
                flavor: label,
                content: item.data.description ?? "",
            } )
        } else {
            // Retrieve roll data.
            const rollData = this.getRollData()

            // Invoke the roll and submit it to chat.
            const roll = new Roll( rollData.item.formula, rollData ).roll()
            roll.toMessage( {
                speaker: speaker,
                rollMode: rollMode,
                flavor: label,
            } )
            return roll
        }
    }
    async AttackCheck () {
        if ( game.user.isGM ) {
            console.log( 'GM' )
            actorData = this.actor.data
            let reflex = actorData.data.defences.reflex.value
            if ( attackRoll.total >= reflex ) {
                console.log( 'попал' )
                let { value } = actorData.data.health.value
                let obj = {}
                value -= damageRoll.total
                obj[ 'data.health.value' ] = value
                await actor.update
                console.log( actorData.data.health.value )
            }
        } else console.log( 'not a GM' )
    }
}
