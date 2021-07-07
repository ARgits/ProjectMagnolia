export default class ARd20SocketHandler {
    static async updateActorData ( data ) {
        if ( game.user.isGM ) {
            await data.actor.update( data.obj )
        }
    }
}