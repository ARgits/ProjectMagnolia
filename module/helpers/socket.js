export default class ARd20SocketHandler {
    static async updateCharacterData ( actor ) {
        if ( game.user.isGM ) {
            let { value } = actor.data.data.health
            console.log( actor.data.data.health.value )
            value -= damageRoll.total
            let obj = {}
            obj[ 'data.health.value' ] = value
            await actor.update( obj )
            console.log( actor.data.data.health.value )
        }
    }
}