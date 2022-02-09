export default class ARd20SocketHandler {
  //@ts-expect-error
  static async updateActorData(data) {
    if (game.user!.isGM) {
      const actor = game.actors!.get(data.actor._id);
      //@ts-expect-error
      if (actor) await actor.update(data.update, { "data.health.value": data.value });
    }
  }
}
