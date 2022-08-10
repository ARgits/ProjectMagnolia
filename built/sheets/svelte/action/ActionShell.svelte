<svelte:options accessors={true}/>

<script>

    import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
    import Action from "./Action.svelte";

    export let elementRoot;
    export let action;

</script>
<ApplicationShell bind:elementRoot>
    <Action {action}/>
</ApplicationShell>

<style lang="scss">
  div.formula {
    display: flex;
  }
</style>
