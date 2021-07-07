export default class ARd20SocketHandler {
    static async updateActorData ( data ) {
        if ( game.user.isGM ) {
            const actor = data.actor
            const obj = data.obj
            await actor.update( obj )
        }
    }
}