export default class ARd20SocketHandler {
    static async updateCharacterData ( data ) {
        if ( game.user.isGM ) {
            const targets = game.user.targets
            if (targets>0){
                targets.forEach(async function(token){
                })
            }
            console.log( actor.data.data.health.value )
        }
    }
}