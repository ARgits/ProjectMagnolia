<svelte:options accessors={true}/>
<script>
    export let stat;
</script>
<div class="container">
    {#if stat.parentID}
        <i class="fa-solid fa-arrow-right"></i>
    {/if}
    <div class="data">
        {stat.actionName}: <span class='result {stat?.hit?"hit":"fail"}'>{stat?.attack ?? stat?.damage}</span>
    </div>
    <ul class="subActions">
        {#each stat.subAct as subStat}
            <li>
                <svelte:self stat={subStat}/>
            </li>
        {/each}
    </ul>
</div>
<style lang="scss">
  .container {
    display: flex;
    align-items: baseline;

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


    & .result.hit {
      color: green;
    }

    & .result.fail {
      color: red;
    }
  }

  .subActions {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }
</style>