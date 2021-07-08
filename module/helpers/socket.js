export default class ARd20SocketHandler {
    static async updateActorData ( data ) {
        if ( game.user.isGM ) {
            await data.actor._id.update( data.update, {'data.helath.value':data.value})
        }
    }
}