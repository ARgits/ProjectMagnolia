export default class ARd20SocketHandler {
    static async updateCharacterData ( data ) {
        if ( game.user.isGM ) {
            if ( target.data.attack >= reflex ) {
                console.log( 'HIT!' )
                await actor.update( obj )
            } else console.log( "miss" )
        }
    }
}