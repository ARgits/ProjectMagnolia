<script>
    import ActionStatistics from "../helpers/actionStatistics/actionStatistics.js";

    export let results;


    let statisticsWindow = null;

    async function onHoverToken(tokenUUID, hover) {
        const token = await fromUuid(tokenUUID);
        token._object.hover = hover;
        token._object.refresh();
    }

    function calculateDamage(stats) {
        return stats.map(stat => stat.damage ?? 0).reduce((prev, current) => prev + current);
    }

    function openStatistics() {
        if (!statisticsWindow) {
            statisticsWindow = new ActionStatistics(results);
        }
        statisticsWindow.render(true);
    }
</script>
<div>
    this is roll results from attack Action
</div>
{#each results as result,index(index)}
    <div class="result">
        <div class="target" on:mouseenter={()=>onHoverToken(result.token, true)}
             on:mouseleave={()=>onHoverToken(result.token, false)}>
            <img alt="target pic" src={result.targetIcon}/>
            <span>{result.targetName}: </span>
        </div>
        {#if result.stats.filter(stat => stat.damage).length > 0}
            <div>Total Damage: {calculateDamage(result.stats)}</div>
        {/if}
        <i on:click={openStatistics} class="fa-solid fa-square-info"></i>
    </div>
{/each}
<i on:click={openStatistics} class="fa-solid fa-square-info"></i>
<style lang="scss">
  .target,
  .stat {
    flex: 1 0
  }

  .target {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;

    & img {
      width: 3rem;
      border: none
    }

    & span {
      padding: 0 0.1rem
    }
  }

  .stat {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 0.2rem;
    margin: 0.1rem;

    & .success {
      color: green
    }

    & .fail {
      color: red
    }
  }

  .result {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    align-items: center;
    align-content: center;
    margin: 0.1rem;
    border: 1px solid black;
    border-radius: 10px;
    padding: 0.1rem;
  }

  .actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    align-content: center;
  }
</style>