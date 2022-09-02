<svelte:options accessors={true}></svelte:options>
<script>
    import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
    import { getContext } from "svelte";
    import TargetComponent from "./TargetComponent.svelte";
    import ActionComponent from "./ActionComponent.svelte";

    export let elementRoot;
    const { application } = getContext('external');
    const actions = application.statistics;

    function firstAction(target) {
        return target.stats.filter((stat) => stat.parentID === null)[0];
    }

    console.log(actions);
</script>
<ApplicationShell bind:elementRoot>
    <div class="container">
        {#each actions as target (target.token)}
            <div class="stat">
                <TargetComponent uuid={target.token}/>
                <ActionComponent stat={firstAction(target)} target={target}/>
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