export default class ARd20SocketHandler {
  //@ts-expect-error
  static async updateActorData(data) {
    if (game.user.isGM) {
      const actor = data.actor;
      //@ts-expect-error
      if (actor) await actor.update(data.update);
    }
  }
}
