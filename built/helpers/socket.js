export default class ARd20SocketHandler {
  //@ts-expect-error
  static async updateActorData(data) {
      console.log('socket data',data)
      console.log('Socket Called, its GM:', game.user.isGM,' and its active: ',game.user.active)
    if (!game.user.isGM) return;
    // if logged-in user is the active GM with the lowest user id
    const isResponsibleGM = game.users
      .filter((user) => user.isGM && user.active)
      .some((other) => other.data._id <= game.user.data._id);

    if (!isResponsibleGM) return;
    console.log('HERE GM ON SOCKET CALLING')
    const token = await fromUuid(data.tokenId)
    const actor = token?.actor;
    //@ts-expect-error
    if (actor) await actor.update(data.update);
  }
}
