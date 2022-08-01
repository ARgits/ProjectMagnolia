<svelte:options accessors={true}/>
<script>
    import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
    import { getContext } from "svelte";
    import { writable } from "svelte/store";

    export let elementRoot;
    export let mainToken;
    let targets = [];
    let vision;
    const uuid = $mainToken.uuid;
    console.log(uuid);
    const { application } = getContext('external');
    console.log(application);
    const allTokens = writable(game.scenes.current.tokens.map((t) =>
    {
        return { uuid: t.uuid, canSee: false, isTargeted: false, doc: t };
    }));
    $:{
        for (const target of $allTokens)
        {
            if (target.uuid !== uuid)
            {
                const token = target.doc;
                target.canSee = $mainToken.object.vision.fov.contains(token.x, token.y);
                target.isTargeted = target.canSee ? target.isTargeted : false;
                token.object.setTarget(target.isTargeted, {
                    groupSelection: true,
                    user: game.user.current,
                    releaseOthers: false
                });
            }

        }
    }
</script>
<ApplicationShell bind:elementRoot>
    {#each $allTokens as target}
        {#if target.canSee}
            <div class="target"
                 class:targeted={target.doc.object.isTargeted}
                 on:click={()=>{target.doc.object.setTarget(!target.doc.object.isTargeted,
                 {groupSelection:true,
                 user:game.user.current,
                 releaseOthers:false});
                     target.isTargeted=target.doc.object.isTargeted}}>
                <img src={target.doc.texture.src} alt="token img"/>
                <span>{target.doc.name}</span>
            </div>
        {/if}
    {/each}
</ApplicationShell>
<style lang="scss">
  img {
    min-width: 50px;
    max-width: 50px;
  }

  div.target {
    border: 1px solid black;
    border-radius: 5px;
    min-width: 75px;
    max-width: 75px;
    height: 50px;
  }

  div.target.targeted {
    background-color: #ff6c4a;
  }
</style>