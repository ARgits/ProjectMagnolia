<svelte:options accessors={true}/>
<script>
    export let uuid;

    function getToken(uuid) {
        const token = fromUuidSync(uuid);
        if (token) {
            return { name: token.name, src: token.texture.src };
        }
    }

    const { name, src } = getToken(uuid);
</script>
<div class="target">
    <img {src} alt="token image"/>
    <span>{name}</span>
</div>
<style lang="scss">
  .target {
    display: flex;
    flex-direction: column;
    flex: 1 0 15%;
    align-items: center;

    & img {
      width: min(100%, 100px)
    }

    & > * {
      margin: 0.25rem 0;
    }



  }
</style>