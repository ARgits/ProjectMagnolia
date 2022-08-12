<svelte:options accessors={true}/>
<script>
    import { applyStyles } from "@typhonjs-fvtt/runtime/svelte/action";
    import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

    export let doc;
    export let options;
    export let application;
    console.log(application.reactive.damageInput);
    const inputStore = application.reactive.damageInput;

    $:position = inputStore.getBoundingClientRect();
    console.log($doc.damage);
    $: pos = {
        left: `${position.left}px`,
        top: `${position.top + position.height}px`,
        width: `${position.width}px`,
    };

    async function handleDamage(dam) {
        if (!DamageIncluded(dam)) {
            $doc.damage = [...$doc.damage, dam];
        }
        else {
            const index = $doc.damage.findIndex(d => d[0] === dam[0] && d[1] === dam[1]);
            $doc.damage.splice(index, 1);
            $doc.damage = [...$doc.damage];
        }
        await application.submit();
    }

    function DamageIncluded(dam) {
        return $doc.damage.filter(d => d[0] === dam[0] && d[1] === dam[1]).length > 0;
    }
</script>
<div use:applyStyles={pos} class="options">
    {#each options as type}
        <label class:checked={DamageIncluded(["phys",type[0]])}>
            <input on:click={()=>{handleDamage(["phys",type[0]])}} type="checkbox"
                   value={["phys",type[0]]}/> Physical {localize(type[1])}
        </label>
    {/each}
    {#each options as type}
        <label class:checked={DamageIncluded(["mag",type[0]])}>
            <input on:click={()=>{handleDamage(["mag",type[0]])}} type="checkbox"
                   value={["mag",type[0]]}/> Magical {localize(type[1])}
        </label>
    {/each}
</div>
<style lang="scss">
  div {
    z-index: 9999;
    position: absolute;
    border: 1px solid black;
    background-color: rgba(0, 0, 0, 0.5);
    max-height: 150px;
    overflow-y: scroll;
  }

  .options {
    position: absolute;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid black;
    border-top: none;
    background: rgb(241, 237, 237);
  }

  label {
    width: 100%;

    text-align: center;

    &.checked {
      background-color: rgba(0, 255, 0, 0.3)
    }

    &:hover {
      cursor: pointer;
      background-color: rgba(0, 0, 0, 0.1);
    }

    & input[type="checkbox"] {
      appearance: none;
      margin: 0;
      border: none;
      display: none
    }

  }
</style>