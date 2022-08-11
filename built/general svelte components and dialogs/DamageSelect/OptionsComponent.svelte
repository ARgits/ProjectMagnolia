<svelte:options accessors={true}/>
<script>
    import { applyStyles } from "@typhonjs-fvtt/runtime/svelte/action";
    import { getContext } from "svelte";

    export let doc;
    export let options;
    export let position;
    console.log($doc.damage);
    const { top, left, width, height } = position;
    const pos = {
        left: `${left}px`,
        top: `${top + height}px`,
        width: `${width}px`,
    };
</script>
<div use:applyStyles={pos} class="options">
    {#each options as type}
        <label class:checked={$doc.damage.includes(["phys",type[0]])}>
            <input type="checkbox" bind:group={$doc.damage} value={["phys",type[0]]}/> {type[1]}
        </label>
    {/each}
    {#each options as type}
        <label class:checked={$doc.damage.includes(["mag",type[0]])}>
            <input type="checkbox" bind:group={$doc.damage} value={["mag",type[0]]}/> {type[1]}
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
    background: url("../ui/parchment.jpg") repeat;
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