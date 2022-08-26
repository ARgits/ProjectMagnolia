<svelte:options accessors={true}></svelte:options>
<script>
    import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
    import { getContext } from "svelte";
    import TargetComponent from "./TargetComponent.svelte";
    import ActionComponent from "./ActionComponent.svelte";

    export let elementRoot;
    const { application } = getContext('external');
    const actions = application.actions;

    console.log(actions);
</script>
<ApplicationShell bind:elementRoot>
    <h1>this is statistics</h1>
    <div class="container">
        {#each actions as stat (stat[0])}
            <div class="stat">
                <TargetComponent uuid={stat[0]}/>
                <ActionComponent stat={stat[1]}/>
            </div>
        {/each}
    </div>
</ApplicationShell>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
  }

  .stat {
    display: flex;
    align-items: center;
    margin: 0.25rem 0;
    padding-bottom: 0.1rem;
    border-bottom: 1px solid black;
  }
</style>