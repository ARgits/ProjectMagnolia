<svelte:options accessors={true}/>
<script>
    import RollTooltip from "./RollTooltip.svelte";
    import { getContext } from "svelte";

    export let stat;
    export let target;
    const hit = stat.hit;
    const rollData = stat.rollData;
    let rollInstance, tooltipDataPromise;
    if (rollData) {
        rollInstance = CONFIG.Dice[rollData.class].fromData(rollData);
        //TODO: избавиться от лишних проверок после создания других классов бросков (не только для урона)
        tooltipDataPromise = rollData.class !== 'Roll' ? rollInstance.setDataForSvelte() : rollInstance.render();
    }
    const subActions = target.stats.filter((act) => act.parentID === stat.id);

</script>
<div class="container" class:parent={!stat.parentID}>
    {#if stat.parentID}
        <i class="fa-solid fa-arrow-right"></i>
    {/if}
    <div class="data">
        {stat.actionName}
        {#if rollData}
            {#await tooltipDataPromise}
                ...loading
            {:then data}
                <RollTooltip {data} rollClass={rollData.class} {hit}/>
            {/await}
        {/if}
    </div>
    <ul class="subActions">
        {#each subActions as subStat}
            <li>
                <svelte:self stat={subStat} target={target}/>
            </li>
        {/each}
    </ul>
</div>
<style lang="scss">
  .container {
    display: flex;
    align-items: baseline;

    &.parent {
      border-left: 1px solid;
    }

    & i {
      margin-right: 0.25rem;
    }

    flex: 1 0 85%;
  }

  .data {
    border: 1px solid black;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    padding: 0.25rem;
    margin: 0.25rem;
  }

  .subActions {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }
</style>