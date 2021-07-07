export default class ARd20SocketHandler {
    static async updateCharacterData ( data ) {
        if ( game.user.isGM ) {
            if ( data.target.data.attack >= data.reflex ) {
                console.log( 'HIT!' )
                await data.actor.update( data.obj )
            } else console.log( "miss" )
        }
    }
}