export default class ARd20SocketHandler {
    static async updateActorData ( data ) {
        if ( game.user.isGM ) {
            const actor = game.actors.get(data.actor._id);
            await actor.update( data.update, {'data.health.value':data.value})
        }
    }
}